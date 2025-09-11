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

    if (!student.classId) {
      return NextResponse.json({ error: "Student class information is missing" }, { status: 400 });
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
        isActive: true,
        startTime: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        subject: true,
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
        title: `Upcoming: ${timetable.subject?.name || 'Unknown Subject'}`,
        message: `${message}`,
        timestamp: timetable.startTime,
        read: false,
        timetableId: timetable.id,
        subjectName: timetable.subject?.name || 'Unknown Subject',
      });
    });

    // 2. Recently added topics - functionality removed (model doesn't exist)

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
        startTime: {
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
          title: `Schedule Updated: ${timetable.subject?.name || 'Unknown Subject'}`,
          message: `Class details have been updated for ${timetable.startTime.toLocaleDateString()}`,
          timestamp: timetable.updatedAt,
          read: false,
          timetableId: timetable.id,
          subjectName: timetable.subject?.name || 'Unknown Subject',
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
        isActive: true,
        startTime: {
          gte: now, // Only future classes today
          lte: endOfToday,
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