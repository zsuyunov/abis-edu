import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const currentUserId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");
    
    if (!currentUserId || userRole !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId") || currentUserId;
    
    // Get current time and time ranges for notifications
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get upcoming classes for today
    const todayClasses = await prisma.timetable.findMany({
      where: {
        teacherId,
        status: "ACTIVE",
        fullDate: {
          gte: today,
          lt: tomorrow,
        },
        startTime: {
          gte: now,
        },
      },
      include: {
        class: true,
        subject: true,
        topics: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 10,
    });

    // Get classes starting in next 15 minutes
    const immediateclasses = todayClasses.filter(timetable => {
      const startTime = new Date(timetable.startTime);
      return startTime >= now && startTime <= in15Minutes;
    });

    // Get classes starting in next hour
    const upcomingClasses = todayClasses.filter(timetable => {
      const startTime = new Date(timetable.startTime);
      return startTime > in15Minutes && startTime <= in1Hour;
    });

    // Get classes without topics for today
    const classesWithoutTopics = todayClasses.filter(timetable => 
      timetable.topics.length === 0
    );

    // Get overdue topic updates (classes from yesterday or earlier without completed topics)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const overdueTopics = await prisma.timetable.findMany({
      where: {
        teacherId,
        status: "ACTIVE",
        fullDate: {
          gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          lt: today,
        },
        topics: {
          none: {
            status: "COMPLETED",
          },
        },
      },
      include: {
        class: true,
        subject: true,
        topics: true,
      },
      orderBy: {
        fullDate: "desc",
      },
      take: 5,
    });

    // Get classes for supervised classes without topics (for supervisors)
    const supervisedClasses = await prisma.class.findMany({
      where: {
        supervisorId: teacherId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    let supervisedClassesWithoutTopics = [];
    if (supervisedClasses.length > 0) {
      supervisedClassesWithoutTopics = await prisma.timetable.findMany({
        where: {
          classId: {
            in: supervisedClasses.map(c => c.id),
          },
          status: "ACTIVE",
          fullDate: {
            gte: yesterday,
            lt: tomorrow,
          },
          topics: {
            none: {},
          },
        },
        include: {
          class: true,
          subject: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          fullDate: "desc",
        },
        take: 10,
      });
    }

    // Format notifications
    const notifications = [
      // Immediate classes (high priority)
      ...immediateclasses.map(timetable => ({
        id: `immediate-${timetable.id}`,
        type: "immediate",
        priority: "high",
        title: "Class Starting Soon!",
        message: `${timetable.subject.name} with ${timetable.class.name} starts in ${Math.ceil((new Date(timetable.startTime).getTime() - now.getTime()) / (1000 * 60))} minutes`,
        time: new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: timetable.topics.length > 0,
        data: timetable,
      })),

      // Upcoming classes (medium priority)
      ...upcomingClasses.map(timetable => ({
        id: `upcoming-${timetable.id}`,
        type: "upcoming",
        priority: "medium",
        title: "Upcoming Class",
        message: `${timetable.subject.name} with ${timetable.class.name} in ${Math.ceil((new Date(timetable.startTime).getTime() - now.getTime()) / (1000 * 60))} minutes`,
        time: new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: timetable.topics.length > 0,
        data: timetable,
      })),

      // Classes without topics (low priority)
      ...classesWithoutTopics.slice(0, 3).map(timetable => ({
        id: `no-topics-${timetable.id}`,
        type: "no-topics",
        priority: "low",
        title: "Missing Topic",
        message: `${timetable.subject.name} with ${timetable.class.name} today has no topics added`,
        time: new Date(timetable.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: false,
        data: timetable,
      })),

      // Overdue topics (medium priority)
      ...overdueTopics.slice(0, 2).map(timetable => ({
        id: `overdue-${timetable.id}`,
        type: "overdue",
        priority: "medium",
        title: "Overdue Topic Update",
        message: `${timetable.subject.name} with ${timetable.class.name} from ${new Date(timetable.fullDate).toLocaleDateString()} needs topic completion`,
        time: new Date(timetable.fullDate).toLocaleDateString(),
        location: `Room ${timetable.roomNumber}`,
        hasTopics: timetable.topics.length > 0,
        data: timetable,
      })),

      // Supervised classes without topics (for supervisors)
      ...supervisedClassesWithoutTopics.slice(0, 3).map(timetable => ({
        id: `supervised-no-topics-${timetable.id}`,
        type: "supervised",
        priority: "low",
        title: "Supervised Class Missing Topics",
        message: `${timetable.teacher.firstName} ${timetable.teacher.lastName}'s ${timetable.subject.name} class with ${timetable.class.name} has no topics`,
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
      notifications: notifications.slice(0, 10), // Limit to 10 notifications
      summary: {
        totalNotifications: notifications.length,
        immediate: immediateclasses.length,
        upcoming: upcomingClasses.length,
        withoutTopics: classesWithoutTopics.length,
        overdue: overdueTopics.length,
        supervised: supervisedClassesWithoutTopics.length,
        isSupervisor: supervisedClasses.length > 0,
      },
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
