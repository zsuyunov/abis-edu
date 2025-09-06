import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

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
    const studentId = url.searchParams.get("studentId") || session.id;
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const view = url.searchParams.get("view") || "weekly"; // weekly, monthly, termly, yearly
    const timeFilter = url.searchParams.get("timeFilter") || "current"; // current, past
    
    // Get student information with class details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            academicYear: true,
            branch: true,
          },
        },
        branch: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify that the current user can access this student's data
    if (session.id !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get academic years for filter options
    let availableAcademicYears;
    if (timeFilter === "current") {
      // Get current academic year
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { isCurrent: true, status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      });
    } else {
      // Get past academic years
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { isCurrent: false },
        orderBy: { startDate: "desc" },
      });
    }

    // Determine which academic year to use
    let targetAcademicYearId;
    if (academicYearId) {
      targetAcademicYearId = parseInt(academicYearId);
    } else if (timeFilter === "current") {
      targetAcademicYearId = availableAcademicYears[0]?.id || student.class.academicYearId;
    } else {
      // For past view, default to most recent past academic year
      targetAcademicYearId = availableAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ 
        timetables: [], 
        availableAcademicYears, 
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          class: student.class,
        },
        message: "No academic year data available"
      });
    }

    // Build filter conditions for timetables
    const where: any = {
      classId: student.classId,
      academicYearId: targetAcademicYearId,
      status: "ACTIVE",
    };

    if (subjectId) where.subjectId = parseInt(subjectId);

    // Date filtering
    if (startDate && endDate) {
      where.fullDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get timetables for the student's class
    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        branch: true,
        academicYear: true,
        topics: {
          where: {
            status: {
              in: ["COMPLETED", "IN_PROGRESS"], // Only show completed or in-progress topics to students
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attendances: {
          where: {
            studentId: studentId,
          },
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
    });

    // Get subjects for filter options
    const subjects = await prisma.subject.findMany({
      where: {
        timetables: {
          some: {
            classId: student.classId,
            academicYearId: targetAcademicYearId,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate progress statistics
    const progressStats = {
      totalLessons: timetables.length,
      lessonsWithTopics: timetables.filter(t => t.topics.length > 0).length,
      completedTopics: timetables.reduce((sum, t) => 
        sum + t.topics.filter(topic => topic.status === "COMPLETED").length, 0
      ),
      inProgressTopics: timetables.reduce((sum, t) => 
        sum + t.topics.filter(topic => topic.status === "IN_PROGRESS").length, 0
      ),
    };

    // Calculate subject-wise progress
    const subjectProgress = subjects.map(subject => {
      const subjectTimetables = timetables.filter(t => t.subjectId === subject.id);
      const subjectTopics = subjectTimetables.flatMap(t => t.topics);
      const completedTopics = subjectTopics.filter(topic => topic.status === "COMPLETED").length;
      const totalTopics = subjectTopics.length;
      
      return {
        subject: subject.name,
        subjectId: subject.id,
        totalLessons: subjectTimetables.length,
        lessonsWithTopics: subjectTimetables.filter(t => t.topics.length > 0).length,
        totalTopics,
        completedTopics,
        completionRate: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      };
    });

    return NextResponse.json({
      timetables,
      availableAcademicYears,
      subjects,
      progressStats,
      subjectProgress,
      currentAcademicYear: availableAcademicYears.find(ay => ay.id === targetAcademicYearId),
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class,
        branch: student.branch,
      },
      view,
      timeFilter,
    });

  } catch (error) {
    console.error("Error fetching student timetables:", error);
    return NextResponse.json(
      { error: "Failed to fetch student timetables" },
      { status: 500 }
    );
  }
}
