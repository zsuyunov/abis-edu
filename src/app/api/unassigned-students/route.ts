import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status") || "ACTIVE";

    // Build where clause for unassigned students
    const where: any = {
      status: status as any,
      classId: null, // Students without class assignment
    };
    
    if (branchId) {
      where.branchId = parseInt(branchId);
    }

    // Get unassigned students
    const unassignedStudents = await prisma.student.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        status: true,
      },
      orderBy: { firstName: "asc" },
    });

    // Get total count of all students for statistics
    const totalStudents = await prisma.student.count({
      where: { status: status as any }
    });

    const assignedStudents = await prisma.student.count({
      where: { 
        status: status as any,
        classId: { not: null }
      }
    });

    return NextResponse.json({
      success: true,
      students: unassignedStudents,
      totalCount: unassignedStudents.length,
      assignedCount: assignedStudents,
      totalStudents: totalStudents,
    });

  } catch (error) {
    console.error("Error fetching unassigned students:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch unassigned students" },
      { status: 500 }
    );
  }
}
