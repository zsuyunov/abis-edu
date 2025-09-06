import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchIdParam = searchParams.get("branchId");
    const classIdParam = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const where: any = {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    };

    if (branchIdParam) where.branchId = Number(branchIdParam);
    if (classIdParam) where.classId = Number(classIdParam);
    if (studentId) where.studentId = studentId;

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true} },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        timetable: { select: { id: true, fullDate: true, startTime: true, endTime: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: attendances });
  } catch (error) {
    console.error("attendance/today error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch today's attendance" }, { status: 500 });
  }
}


