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
      return NextResponse.json({ timetables: [] });
    }

    // Get today's date range
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Get today's timetables
    const todaysTimetables = await prisma.timetable.findMany({
      where: {
        classId: { in: teacherAssignments.map(ta => ta.classId) },
        isActive: true,
        startTime: {
          gte: today,
          lte: endOfToday,
        },
      },
      include: {
        subject: true,
        class: true,
        branch: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get upcoming timetables for today
    const upcomingToday = todaysTimetables.filter(timetable =>
      timetable.startTime >= now
    );

    // Transform timetables to include fullDate field
    const transformedTodaysTimetables = todaysTimetables.map(timetable => ({
      ...timetable,
      fullDate: new Date().toISOString().split('T')[0],
      startTime: timetable.startTime?.toISOString() || timetable.startTime,
      endTime: timetable.endTime?.toISOString() || timetable.endTime,
    }));

    const transformedUpcomingToday = upcomingToday.map(timetable => ({
      ...timetable,
      fullDate: new Date().toISOString().split('T')[0],
      startTime: timetable.startTime?.toISOString() || timetable.startTime,
      endTime: timetable.endTime?.toISOString() || timetable.endTime,
    }));

    return NextResponse.json({
      todaysTimetables: transformedTodaysTimetables,
      upcomingToday: transformedUpcomingToday,
      teacherAssignments,
    });
  } catch (error) {
    console.error("Error fetching today's teacher timetables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}