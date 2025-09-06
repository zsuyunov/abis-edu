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
    const parentId = url.searchParams.get("parentId") || session.id;

    // Verify access
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent with children information
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        // Note: Adjust this based on your actual schema relationship
        // This assumes there's a relation between parent and students
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Get children (students) associated with this parent
    // Note: Adjust this query based on your actual schema
    const children = await prisma.student.findMany({
      where: {
        // Assuming there's a parentId field or similar relationship
        // Adjust this based on your actual schema
      },
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    if (children.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const notifications = [];

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true, status: "ACTIVE" },
    });

    if (!currentAcademicYear) {
      return NextResponse.json({ notifications: [] });
    }

    // 1. Daily summary for each child (today's lessons)
    for (const child of children) {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const todaysTimetables = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
          academicYearId: currentAcademicYear.id,
          status: "ACTIVE",
          fullDate: {
            gte: today,
            lte: endOfToday,
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
          startTime: "asc",
        },
      });

      if (todaysTimetables.length > 0) {
        const upcomingLessons = todaysTimetables.filter(t => {
          const startTime = new Date(t.startTime);
          return startTime > now;
        });

        notifications.push({
          id: `daily-summary-${child.id}-${today.toISOString().split('T')[0]}`,
          type: "daily_summary",
          title: `Today's Schedule - ${child.firstName}`,
          message: `${child.firstName} has ${todaysTimetables.length} class${todaysTimetables.length !== 1 ? 'es' : ''} today${upcomingLessons.length > 0 ? `, ${upcomingLessons.length} remaining` : ', all completed'}`,
          timestamp: new Date(),
          read: false,
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          priority: upcomingLessons.length > 0 ? "medium" : "low",
        });
      }
    }

    // 2. Upcoming classes (next 2 hours) for all children
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    for (const child of children) {
      const upcomingTimetables = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
          academicYearId: currentAcademicYear.id,
          status: "ACTIVE",
          startTime: {
            gte: now,
            lte: twoHoursLater,
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
          startTime: "asc",
        },
        take: 3,
      });

      upcomingTimetables.forEach((timetable) => {
        const startTime = new Date(timetable.startTime);
        const timeUntil = startTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntil / (1000 * 60));

        let message = "";
        let priority: "low" | "medium" | "high" = "low";

        if (minutesUntil <= 30) {
          message = `Starting in ${minutesUntil} minutes`;
          priority = "high";
        } else if (minutesUntil <= 60) {
          message = `Starting in 1 hour`;
          priority = "medium";
        } else {
          const hoursUntil = Math.floor(minutesUntil / 60);
          message = `Starting in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
          priority = "low";
        }

        notifications.push({
          id: `upcoming-${timetable.id}`,
          type: "reminder",
          title: `Upcoming: ${timetable.subject.name}`,
          message: `${child.firstName}'s ${timetable.subject.name} class ${message} with ${timetable.teacher.firstName} ${timetable.teacher.lastName}`,
          timestamp: new Date(),
          read: false,
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          timetableId: timetable.id,
          subjectName: timetable.subject.name,
          priority,
        });
      });
    }

    // 3. Recently added topics (last 3 days)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    for (const child of children) {
      const recentTopics = await prisma.timetableTopic.findMany({
        where: {
          timetable: {
            classId: child.classId,
            academicYearId: currentAcademicYear.id,
          },
          createdAt: {
            gte: threeDaysAgo,
          },
          status: {
            in: ["COMPLETED", "IN_PROGRESS"],
          },
        },
        include: {
          timetable: {
            include: {
              subject: true,
            },
          },
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      recentTopics.forEach((topic) => {
        notifications.push({
          id: `topic-${topic.id}`,
          type: "new_topic",
          title: `New Topic: ${topic.title}`,
          message: `${child.firstName}'s ${topic.timetable.subject.name} class has new content added by ${topic.teacher.firstName} ${topic.teacher.lastName}`,
          timestamp: topic.createdAt,
          read: false,
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          timetableId: topic.timetableId,
          subjectName: topic.timetable.subject.name,
          priority: "medium",
        });
      });
    }

    // 4. Timetable changes (last 2 days)
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    for (const child of children) {
      const changedTimetables = await prisma.timetable.findMany({
        where: {
          classId: child.classId,
          academicYearId: currentAcademicYear.id,
          updatedAt: {
            gte: twoDaysAgo,
          },
          fullDate: {
            gte: now, // Only future classes
          },
        },
        include: {
          subject: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 3,
      });

      changedTimetables.forEach((timetable) => {
        // Only notify if updated recently (not just created)
        const timeSinceCreation = timetable.updatedAt.getTime() - timetable.createdAt.getTime();
        if (timeSinceCreation > 60000) { // More than 1 minute difference
          notifications.push({
            id: `change-${timetable.id}`,
            type: "timetable_change",
            title: `Schedule Updated`,
            message: `${child.firstName}'s ${timetable.subject.name} class details have been updated for ${new Date(timetable.fullDate).toLocaleDateString()}`,
            timestamp: timetable.updatedAt,
            read: false,
            childId: child.id,
            childName: `${child.firstName} ${child.lastName}`,
            timetableId: timetable.id,
            subjectName: timetable.subject.name,
            priority: "high",
          });
        }
      });
    }

    // 5. Multi-child summary (if more than one child)
    if (children.length > 1) {
      const allTodaysLessons = await Promise.all(
        children.map(async (child) => {
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          const endOfToday = new Date(today);
          endOfToday.setHours(23, 59, 59, 999);

          const lessons = await prisma.timetable.count({
            where: {
              classId: child.classId,
              academicYearId: currentAcademicYear.id,
              status: "ACTIVE",
              fullDate: {
                gte: today,
                lte: endOfToday,
              },
            },
          });

          return { child: child.firstName, lessons };
        })
      );

      const totalLessons = allTodaysLessons.reduce((sum, item) => sum + item.lessons, 0);

      if (totalLessons > 0) {
        notifications.push({
          id: `multi-child-summary-${now.toISOString().split('T')[0]}`,
          type: "multi_child",
          title: "Family Schedule Today",
          message: `Your children have ${totalLessons} total class${totalLessons !== 1 ? 'es' : ''} today: ${allTodaysLessons.map(item => `${item.child} (${item.lessons})`).join(', ')}`,
          timestamp: new Date(),
          read: false,
          priority: "medium",
        });
      }
    }

    // Sort notifications by priority and timestamp
    notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Newer first
    });

    // Limit to 20 most relevant notifications
    const limitedNotifications = notifications.slice(0, 20);

    return NextResponse.json({
      notifications: limitedNotifications,
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
      },
      children: children.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
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
