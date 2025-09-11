import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId");

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
        AcademicYear: true,
      },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ error: "No teaching assignments found" }, { status: 403 });
    }

    // Get academic year
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, status: "ACTIVE" },
      });
      targetAcademicYearId = currentYear?.id?.toString() || null;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year available" }, { status: 404 });
    }

    // Get timetable statistics
    const totalTimetables = await prisma.timetable.count({
      where: {
        academicYearId: parseInt(targetAcademicYearId),
        isActive: true,
        classId: { in: teacherAssignments.map(ta => ta.classId) },
      },
    });

    const timetablesBySubject = await prisma.timetable.groupBy({
      by: ['subjectId'],
      where: {
        academicYearId: parseInt(targetAcademicYearId),
        isActive: true,
        classId: { in: teacherAssignments.map(ta => ta.classId) },
      },
      _count: {
        id: true,
      },
    });

    const timetablesByDay = await prisma.timetable.groupBy({
      by: ['dayOfWeek'],
      where: {
        academicYearId: parseInt(targetAcademicYearId),
        isActive: true,
        classId: { in: teacherAssignments.map(ta => ta.classId) },
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      totalTimetables,
      teacherAssignments: teacherAssignments.length,
      timetablesBySubject,
      timetablesByDay,
      academicYearId: targetAcademicYearId,
    });
  } catch (error) {
    console.error("Error fetching teacher timetable analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}