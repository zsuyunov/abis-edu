import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id');
    let authenticatedUserId = studentId;

    if (!studentId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = await AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const url = new URL(request.url);
    const requestedStudentId = url.searchParams.get("studentId") || authenticatedUserId;
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Verify student can only access their own attendance data
    if (authenticatedUserId !== requestedStudentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!requestedStudentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }

    // Get attendance records for the date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: requestedStudentId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Format data for the calendar component
    const attendance = attendanceRecords.map(record => ({
      date: record.date.toISOString().split('T')[0],
      status: record.status.toLowerCase(),
      subject: record.subject.name,
      subjectId: record.subject.id.toString(),
    }));

    return NextResponse.json({
      attendance,
      totalRecords: attendanceRecords.length,
    });

  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}