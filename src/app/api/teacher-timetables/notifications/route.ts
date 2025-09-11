import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher's assignments
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: userId,
        status: "ACTIVE",
      },
      include: {
        Class: true,
        Subject: true,
        Branch: true,
      },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const notifications: any[] = [];

    // Get upcoming classes for today and tomorrow
    const upcomingTimetables = await prisma.timetable.findMany({
      where: {
        classId: { in: teacherAssignments.map(ta => ta.classId) },
        isActive: true,
        startTime: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    upcomingTimetables.forEach((timetable) => {
      const message = `Class at ${timetable.startTime.toLocaleTimeString()}`;
      notifications.push({
        id: `upcoming-${timetable.id}`,
        type: "upcoming",
        title: `Upcoming: ${timetable.subject?.name || 'Unknown Subject'}`,
        message: message,
        timestamp: timetable.startTime,
        read: false,
        timetableId: timetable.id,
        subjectName: timetable.subject?.name || 'Unknown Subject',
        className: timetable.class?.name || 'Unknown Class',
      });
    });

    // Get recently updated timetables
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentChanges = await prisma.timetable.findMany({
      where: {
        classId: { in: teacherAssignments.map(ta => ta.classId) },
        updatedAt: {
          gte: threeDaysAgo,
        },
        createdAt: {
          lt: new Date(Date.now() - 60000), // More than 1 minute ago
        },
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    recentChanges.forEach((timetable) => {
      notifications.push({
        id: `change-${timetable.id}`,
        type: "change",
        title: `Schedule Updated: ${timetable.subject?.name || 'Unknown Subject'}`,
        message: `Timetable updated for ${timetable.class?.name || 'Unknown Class'}`,
        timestamp: timetable.updatedAt,
        read: false,
        timetableId: timetable.id,
      });
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching teacher timetable notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}