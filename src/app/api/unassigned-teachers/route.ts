import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    // Build query conditions
    const where: any = {
      status: "ACTIVE",
    };
    
    if (branchId) {
      where.branchId = parseInt(branchId);
    }

    // Unassigned: no active timetable rows (no current assignments)
    const assignedTeacherIds = new Set(
      (
        await prisma.timetable.findMany({
          where: { status: 'ACTIVE', ...(branchId ? { branchId: parseInt(branchId) } : {}) },
          select: { teacherId: true },
        })
      ).map((t) => t.teacherId)
    );

    const unassignedTeachers = await prisma.teacher.findMany({
      where: {
        ...where,
        id: { notIn: Array.from(assignedTeacherIds) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherId: true,
        // branch relation removed; could derive via other logic later
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    // Get supervised classes for each teacher through TeacherAssignment
    const teachersWithSupervisedClasses = await Promise.all(
      unassignedTeachers.map(async (teacher) => {
        const supervisorAssignment = await prisma.teacherAssignment.findFirst({
          where: {
            teacherId: teacher.id,
            role: "SUPERVISOR",
          },
          select: {
            Class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return {
          ...teacher,
          supervisedClass: supervisorAssignment?.Class || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      teachers: teachersWithSupervisedClasses,
    });
  } catch (error) {
    console.error("Unassigned teachers API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
