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

    // Verify access
    if (session.id !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

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

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true, status: "ACTIVE" },
    });

    if (!currentAcademicYear) {
      return NextResponse.json({ notifications: [] });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const notifications = [];

    // 1. Upcoming classes (next 24 hours)
    const upcomingTimetables = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
        fullDate: {
          gte: now,
          lte: tomorrow,
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

    upcomingTimetables.forEach((timetable) => {
      const startTime = new Date(timetable.startTime);
      const timeUntil = startTime.getTime() - now.getTime();
      const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

      let message = "";
      if (hoursUntil < 1 && minutesUntil > 0) {
        message = `Starting in ${minutesUntil} minutes`;
      } else if (hoursUntil < 24) {
        message = `Starting in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
      } else {
        message = `Tomorrow at ${startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}`;
      }

      notifications.push({
        id: `upcoming-${timetable.id}`,
        type: "upcoming",
        title: `Upcoming: ${timetable.subject.name}`,
        message: `${message} with ${timetable.teacher.firstName} ${timetable.teacher.lastName}`,
        timestamp: new Date(),
        read: false,
        timetableId: timetable.id,
        subjectName: timetable.subject.name,
      });
    });

    // 2. Recently added topics (last 7 days)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentTopics = await prisma.timetableTopic.findMany({
      where: {
        timetable: {
          classId: student.classId,
          academicYearId: currentAcademicYear.id,
        },
        createdAt: {
          gte: weekAgo,
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
      take: 10,
    });

    recentTopics.forEach((topic) => {
      notifications.push({
        id: `topic-${topic.id}`,
        type: "new_topic",
        title: `New Topic: ${topic.title}`,
        message: `Added by ${topic.teacher.firstName} ${topic.teacher.lastName}`,
        timestamp: topic.createdAt,
        read: false,
        timetableId: topic.timetableId,
        subjectName: topic.timetable.subject.name,
      });
    });

    // 3. Timetable changes (last 3 days)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const changedTimetables = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        updatedAt: {
          gte: threeDaysAgo,
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
      take: 5,
    });

    changedTimetables.forEach((timetable) => {
      // Only notify if updated recently (not just created)
      const timeSinceCreation = timetable.updatedAt.getTime() - timetable.createdAt.getTime();
      if (timeSinceCreation > 60000) { // More than 1 minute difference
        notifications.push({
          id: `change-${timetable.id}`,
          type: "change",
          title: `Schedule Updated: ${timetable.subject.name}`,
          message: `Class details have been updated for ${new Date(timetable.fullDate).toLocaleDateString()}`,
          timestamp: timetable.updatedAt,
          read: false,
          timetableId: timetable.id,
          subjectName: timetable.subject.name,
        });
      }
    });

    // 4. Daily reminders for today's classes
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todaysTimetables = await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        academicYearId: currentAcademicYear.id,
        status: "ACTIVE",
        fullDate: {
          gte: today,
          lte: endOfToday,
        },
        startTime: {
          gte: now, // Only future classes today
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 3,
    });

    if (todaysTimetables.length > 0) {
      notifications.push({
        id: `daily-reminder-${today.toISOString().split('T')[0]}`,
        type: "reminder",
        title: `Today's Schedule`,
        message: `You have ${todaysTimetables.length} class${todaysTimetables.length !== 1 ? 'es' : ''} remaining today`,
        timestamp: new Date(),
        read: false,
        timetableId: todaysTimetables[0].id,
        subjectName: "Multiple Subjects",
      });
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to 20 most recent notifications
    const limitedNotifications = notifications.slice(0, 20);

    return NextResponse.json({
      notifications: limitedNotifications,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.class,
      },
    });

  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
