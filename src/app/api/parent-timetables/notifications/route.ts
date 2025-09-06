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
    const parentId = url.searchParams.get("parentId") || session.id;
    const childId = url.searchParams.get("childId"); // If specified, get notifications for specific child
    
    // Verify access
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent information with children
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            class: {
              include: {
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    if (parent.students.length === 0) {
      return NextResponse.json({ notifications: [], summary: {}, children: [] });
    }

    // Get current time and time ranges for notifications
    const now = new Date();
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
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
      return NextResponse.json({ notifications: [], summary: {}, children: parent.students });
    }

    // Filter children if specific child requested
    const targetChildren = childId 
      ? parent.students.filter(child => child.id === childId)
      : parent.students;

    const allNotifications = [];
    const childSummaries = [];

    for (const child of targetChildren) {
      // Get today's classes for this child
      const todayClasses = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
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

      // Get upcoming classes (next 1 hour)
      const upcomingClasses = todayClasses.filter(timetable => {
        const startTime = new Date(timetable.startTime);
        return startTime >= now && startTime <= in1Hour;
      });

      // Get next classes (1-2 hours ahead)
      const nextClasses = todayClasses.filter(timetable => {
        const startTime = new Date(timetable.startTime);
        return startTime > in1Hour && startTime <= in2Hours;
      });

      // Get tomorrow's first few classes
      const tomorrowStart = new Date(tomorrow);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const tomorrowClasses = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
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
        take: 3,
      });

      // Get classes with new topics (topics created/updated in last 24 hours)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const classesWithNewTopics = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
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
        take: 3,
      });

      // Check for timetable changes (updated in last 24 hours)
      const timetableUpdates = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
          academicYearId: currentAcademicYear.id,
          status: "ACTIVE",
          updatedAt: {
            gte: yesterday,
          },
          fullDate: {
            gte: today,
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
        take: 2,
      });

      // Create notifications for this child
      const childNotifications = [
        // Upcoming classes (high priority)
        ...upcomingClasses.map(timetable => ({
          id: `upcoming-${child.id}-${timetable.id}`,
          type: "upcoming",
          priority: "high",
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          title: `${child.firstName}'s Class Starting Soon!`,
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
          id: `next-${child.id}-${timetable.id}`,
          type: "next",
          priority: "medium",
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          title: `${child.firstName}'s Upcoming Class`,
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
        ...tomorrowClasses.slice(0, 1).map(timetable => ({
          id: `tomorrow-${child.id}-${timetable.id}`,
          type: "tomorrow",
          priority: "low",
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          title: `${child.firstName}'s Tomorrow Schedule`,
          message: `First class: ${timetable.subject.name} with ${timetable.teacher.firstName} ${timetable.teacher.lastName}`,
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
        ...classesWithNewTopics.slice(0, 2).map(timetable => ({
          id: `new-topic-${child.id}-${timetable.id}`,
          type: "new-topic",
          priority: "medium",
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          title: `New Topic for ${child.firstName}`,
          message: `${timetable.teacher.firstName} ${timetable.teacher.lastName} added new topic for ${timetable.subject.name}`,
          time: new Date(timetable.fullDate).toLocaleDateString(),
          location: `${timetable.topics[0]?.title || "New content"}`,
          hasTopics: true,
          data: timetable,
        })),

        // Timetable updates (medium priority)
        ...timetableUpdates.map(timetable => ({
          id: `update-${child.id}-${timetable.id}`,
          type: "timetable-update",
          priority: "medium",
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          title: `${child.firstName}'s Timetable Updated`,
          message: `${timetable.subject.name} schedule has been updated`,
          time: new Date(timetable.fullDate).toLocaleDateString(),
          location: `Room ${timetable.roomNumber}`,
          hasTopics: false,
          data: timetable,
        })),
      ];

      allNotifications.push(...childNotifications);

      // Create summary for this child
      childSummaries.push({
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        todayClasses: todayClasses.length,
        tomorrowClasses: tomorrowClasses.length,
        upcoming: upcomingClasses.length,
        next: nextClasses.length,
        newTopics: classesWithNewTopics.length,
        timetableUpdates: timetableUpdates.length,
        nextClass: todayClasses.find(t => new Date(t.startTime) > now),
      });
    }

    // Sort all notifications by priority and time
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    allNotifications.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      return aPriority - bPriority;
    });

    // Create overall summary
    const overallSummary = {
      totalNotifications: allNotifications.length,
      totalChildren: targetChildren.length,
      upcoming: allNotifications.filter(n => n.type === "upcoming").length,
      next: allNotifications.filter(n => n.type === "next").length,
      tomorrow: allNotifications.filter(n => n.type === "tomorrow").length,
      newTopics: allNotifications.filter(n => n.type === "new-topic").length,
      timetableUpdates: allNotifications.filter(n => n.type === "timetable-update").length,
      childSummaries,
    };

    return NextResponse.json({
      notifications: allNotifications.slice(0, 12), // Limit to 12 notifications
      summary: overallSummary,
      children: parent.students.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentId: child.studentId,
        class: child.class,
      })),
    });

  } catch (error) {
    console.error("Error fetching parent notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
