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
    if (!currentUserId || typeof currentUserId !== 'string') {
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

    if (!student.classId) {
      return NextResponse.json({ error: "Student class information is missing" }, { status: 400 });
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

    const notifications: any[] = [];

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
      });
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching timetable notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}