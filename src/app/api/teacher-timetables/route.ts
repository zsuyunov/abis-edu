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
    const branchId = url.searchParams.get("branchId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");

    // Get teacher's assignments to determine access
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: userId,
        status: "ACTIVE",
      },
      include: {
        Branch: true,
        AcademicYear: true,
        Class: true,
        Subject: true,
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

    // Build where clause for timetables
    const whereClause: any = {
      academicYearId: parseInt(targetAcademicYearId),
      isActive: true,
    };

    // Filter by teacher's assignments
    const assignedClassIds = teacherAssignments.map(ta => ta.classId);
    const assignedSubjectIds = teacherAssignments.map(ta => ta.subjectId).filter(id => id !== null);

    if (classId) {
      whereClause.classId = parseInt(classId);
    } else {
      whereClause.classId = { in: assignedClassIds };
    }

    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    } else if (assignedSubjectIds.length > 0) {
      whereClause.subjectId = { in: assignedSubjectIds };
    }

    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }

    // Get timetables
    const timetables = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get available academic years
    const availableAcademicYears = await prisma.academicYear.findMany({
      where: {
        TeacherAssignment: {
          some: {
            teacherId: userId,
            status: "ACTIVE",
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Transform timetables to include fullDate field
    const transformedTimetables = timetables.map(timetable => ({
      ...timetable,
      fullDate: new Date().toISOString().split('T')[0], // Use current date as fallback
      startTime: timetable.startTime?.toISOString() || timetable.startTime,
      endTime: timetable.endTime?.toISOString() || timetable.endTime,
    }));

    return NextResponse.json({
      timetables: transformedTimetables,
      teacherAssignments,
      availableAcademicYears,
      filters: {
        academicYearId: targetAcademicYearId,
        branchId: branchId || null,
        classId: classId || null,
        subjectId: subjectId || null,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher timetables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}