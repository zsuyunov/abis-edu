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
    
    const currentUserId = AuthService.verifyToken(token);
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") || currentUserId;
    
    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify access
    if (currentUserId !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get current time and time ranges for notifications
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true, status: "ACTIVE" },
    });

    if (!currentAcademicYear) {
      return NextResponse.json({ notifications: [], summary: {} });
    }

    // Get today's classes
    const todayClasses = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
        fullDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        topics: {
          where: {
            status: {
              in: ["COMPLETED", "IN_PROGRESS"],
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get upcoming classes (next 30 minutes)
    const upcomingClasses = todayClasses.filter(timetable => {
      const startTime = new Date(timetable.startTime);
      return startTime >= now && startTime <= in30Minutes;
    });

    // Get classes in next 2 hours
    const nextClasses = todayClasses.filter(timetable => {
      const startTime = new Date(timetable.startTime);
      return startTime > in30Minutes && startTime <= in2Hours;
    });

    // Get tomorrow's classes
    const tomorrowStart = new Date(tomorrow);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const tomorrowClasses = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
        fullDate: {
          gte: tomorrowStart,
          lt: dayAfterTomorrow,
        },
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        topics: {
          where: {
            status: {
              in: ["COMPLETED", "IN_PROGRESS"],
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 3, // Limit to first 3 classes of tomorrow
    });

    // Get classes with new topics (topics created/updated in last 24 hours)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const classesWithNewTopics = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
        topics: {
          some: {
            status: {
              in: ["COMPLETED", "IN_PROGRESS"],
            },
            updatedAt: {
              gte: yesterday,
            },
          },
        },
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        topics: {
          where: {
            status: {
              in: ["COMPLETED", "IN_PROGRESS"],
            },
            updatedAt: {
              gte: yesterday,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        fullDate: "desc",
      },
      take: 5,
    });

    // Check for any timetable changes (timetables updated in last 24 hours)
    const timetableUpdates = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
        updatedAt: {
          gte: yesterday,
        },
        fullDate: {
          gte: today, // Only future timetable changes
        },
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        fullDate: "asc",
      },
      take: 3,
    });

    // Format notifications
    const notifications = [
      // Upcoming classes (high priority)
      ...upcomingClasses.map(timetable => ({
        id: `upcoming-${timetable.id}`,
        type: "upcoming",
        priority: "high",
        title: "Class Starting Soon!",
        message: `${timetable.subject.name} with ${timetable.teacher.firstName} ${timetable.teacher.lastName} starts in ${Math.ceil((new Date(timetable.startTime).getTime() - now.getTime()) / (1000 * 60))} minutes`,
        time: new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: timetable.topics.length > 0,
        data: timetable,
      })),

      // Next classes (medium priority)
      ...nextClasses.slice(0, 2).map(timetable => ({
        id: `next-${timetable.id}`,
        type: "next",
        priority: "medium",
        title: "Upcoming Class",
        message: `${timetable.subject.name} with ${timetable.teacher.firstName} ${timetable.teacher.lastName} in ${Math.ceil((new Date(timetable.startTime).getTime() - now.getTime()) / (1000 * 60))} minutes`,
        time: new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: timetable.topics.length > 0,
        data: timetable,
      })),

      // Tomorrow's classes (low priority)
      ...tomorrowClasses.slice(0, 2).map(timetable => ({
        id: `tomorrow-${timetable.id}`,
        type: "tomorrow",
        priority: "low",
        title: "Tomorrow's Schedule",
        message: `${timetable.subject.name} with ${timetable.teacher.firstName} ${timetable.teacher.lastName} tomorrow`,
        time: new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: timetable.topics.length > 0,
        data: timetable,
      })),

      // New topics (medium priority)
      ...classesWithNewTopics.slice(0, 3).map(timetable => ({
        id: `new-topic-${timetable.id}`,
        type: "new-topic",
        priority: "medium",
        title: "New Lesson Topic",
        message: `${timetable.teacher.firstName} ${timetable.teacher.lastName} added new topic for ${timetable.subject.name}`,
        time: new Date(timetable.fullDate).toLocaleDateString(),
        location: `${timetable.topics[0]?.title || "New content"}`,
        hasTopics: true,
        data: timetable,
      })),

      // Timetable updates (medium priority)
      ...timetableUpdates.map(timetable => ({
        id: `update-${timetable.id}`,
        type: "timetable-update",
        priority: "medium",
        title: "Timetable Updated",
        message: `${timetable.subject.name} schedule has been updated`,
        time: new Date(timetable.fullDate).toLocaleDateString(),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: false,
        data: timetable,
      })),
    ];

    // Sort by priority and time
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    notifications.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      return aPriority - bPriority;
    });

    return NextResponse.json({
      notifications: notifications.slice(0, 8), // Limit to 8 notifications
      summary: {
        totalNotifications: notifications.length,
        upcoming: upcomingClasses.length,
        next: nextClasses.length,
        tomorrow: tomorrowClasses.length,
        newTopics: classesWithNewTopics.length,
        timetableUpdates: timetableUpdates.length,
      },
      todayClasses: todayClasses.length,
      tomorrowClasses: tomorrowClasses.length,
    });

  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
