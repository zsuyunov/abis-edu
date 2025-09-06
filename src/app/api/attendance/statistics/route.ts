import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const classId = searchParams.get("classId");
    const branchId = searchParams.get("branchId");
    const subjectId = searchParams.get("subjectId");

    // Build where clause (same as main attendance route)
    const where: any = {};

    if (date) {
      const selectedDate = new Date(date);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(selectedDate.getDate() + 1);
      
      where.date = {
        gte: selectedDate,
        lt: nextDate,
      };
    }

    if (status) {
      where.status = status;
    }

    if (classId) {
      where.student = {
        classId,
      };
    }

    if (branchId) {
      where.student = {
        ...where.student,
        class: {
          branchId,
        },
      };
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { surname: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Get statistics
    const [
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
    ] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
      prisma.attendance.count({ where: { ...where, status: "LATE" } }),
      prisma.attendance.count({ where: { ...where, status: "EXCUSED" } }),
    ]);

    // Calculate attendance rate (present + late + excused / total)
    const attendanceRate = totalRecords > 0 
      ? ((presentCount + lateCount + excusedCount) / totalRecords) * 100
      : 0;

    const statistics = {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
    };

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("Attendance statistics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance statistics" },
      { status: 500 }
    );
  }
}