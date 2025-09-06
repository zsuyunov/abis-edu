import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId") || session.id;
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");

    // Build filter conditions
    const whereConditions: any = {
      teacherId,
      status: "ACTIVE",
    };

    if (academicYearId) whereConditions.academicYearId = parseInt(academicYearId);
    if (classId) whereConditions.classId = parseInt(classId);
    if (subjectId) whereConditions.subjectId = parseInt(subjectId);

    // Get total scheduled lessons
    const totalLessons = await prisma.timetable.count({
      where: whereConditions,
    });

    // Get lessons with topics
    const lessonsWithTopics = await prisma.timetable.count({
      where: {
        ...whereConditions,
        topics: {
          some: {},
        },
      },
    });

    // Get topic statistics
    const topicStats = await prisma.timetableTopic.groupBy({
      by: ['status'],
      where: {
        teacherId,
        ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
        ...(classId && { classId: parseInt(classId) }),
        ...(subjectId && { subjectId: parseInt(subjectId) }),
      },
      _count: {
        status: true,
      },
    });

    // Get completion rate by subject
    const subjectProgress = await prisma.timetable.findMany({
      where: whereConditions,
      include: {
        subject: true,
        topics: true,
      },
    });

    const subjectStats = subjectProgress.reduce((acc: any, timetable) => {
      const subjectName = timetable.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          total: 0,
          withTopics: 0,
          completedTopics: 0,
        };
      }
      
      acc[subjectName].total += 1;
      if (timetable.topics.length > 0) {
        acc[subjectName].withTopics += 1;
        const completedTopics = timetable.topics.filter(t => t.status === 'COMPLETED').length;
        acc[subjectName].completedTopics += completedTopics;
      }
      
      return acc;
    }, {});

    // Get completion rate by class (for supervisors)
    const supervisedClasses = await prisma.class.findMany({
      where: {
        supervisorId: teacherId,
      },
    });

    const classProgress = await Promise.all(
      supervisedClasses.map(async (cls) => {
        const totalClassLessons = await prisma.timetable.count({
          where: {
            classId: cls.id,
            status: "ACTIVE",
            ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
          },
        });

        const lessonsWithTopics = await prisma.timetable.count({
          where: {
            classId: cls.id,
            status: "ACTIVE",
            topics: {
              some: {},
            },
            ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
          },
        });

        const completedTopics = await prisma.timetableTopic.count({
          where: {
            classId: cls.id,
            status: "COMPLETED",
            ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
          },
        });

        return {
          class: cls,
          totalLessons: totalClassLessons,
          lessonsWithTopics,
          completedTopics,
          completionRate: totalClassLessons > 0 ? (lessonsWithTopics / totalClassLessons) * 100 : 0,
        };
      })
    );

    // Get upcoming lessons without topics
    const upcomingLessonsWithoutTopics = await prisma.timetable.findMany({
      where: {
        ...whereConditions,
        fullDate: {
          gte: new Date(),
        },
        topics: {
          none: {},
        },
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
      take: 10,
    });

    // Calculate overall completion rate
    const completionRate = totalLessons > 0 ? (lessonsWithTopics / totalLessons) * 100 : 0;

    // Format topic statistics
    const formattedTopicStats = {
      DRAFT: topicStats.find(s => s.status === 'DRAFT')?._count.status || 0,
      IN_PROGRESS: topicStats.find(s => s.status === 'IN_PROGRESS')?._count.status || 0,
      COMPLETED: topicStats.find(s => s.status === 'COMPLETED')?._count.status || 0,
      CANCELLED: topicStats.find(s => s.status === 'CANCELLED')?._count.status || 0,
    };

    return NextResponse.json({
      overview: {
        totalLessons,
        lessonsWithTopics,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      topicStats: formattedTopicStats,
      subjectProgress: Object.entries(subjectStats).map(([name, stats]: [string, any]) => ({
        subject: name,
        ...stats,
        completionRate: stats.total > 0 ? Math.round((stats.withTopics / stats.total) * 100 * 100) / 100 : 0,
      })),
      classProgress,
      upcomingLessonsWithoutTopics,
      isSupervisor: supervisedClasses.length > 0,
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
