import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    
    // Parse the composite ID (format: teacherId-classId-subjectId-academicYearId)
    const [teacherId, classIdStr, subjectIdStr, academicYearIdStr] = assignmentId.split('-');
    const classId = parseInt(classIdStr);
    const subjectId = parseInt(subjectIdStr);
    
    if (!teacherId || !classId || !subjectId) {
      return NextResponse.json(
        { error: "Invalid assignment ID format" },
        { status: 400 }
      );
    }

    // Remove the connections
    await prisma.$transaction(async (tx) => {
      // Check if this is the only class-subject assignment for this teacher
      const teacherAssignmentsCount = await tx.teacherAssignment.count({
        where: {
          teacherId: teacherId,
          subjectId: subjectId,
        },
      });

      if (teacherAssignmentsCount === 1) {
        // This was the teacher's only assignment for this subject
        // Additional cleanup could be done here if needed
      }

      const classAssignmentsCount = await tx.teacherAssignment.count({
        where: {
          teacherId: teacherId,
          classId: classId,
        },
      });

      if (classAssignmentsCount === 1) {
        // This was the teacher's only assignment for this class
        // Additional cleanup could be done here if needed
      }
    });

    return NextResponse.json({
      success: true,
      message: "Teacher assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { teacherId, classId, subjectId, academicYearId } = body;
    const assignmentId = params.id;
    
    // For now, we'll implement this as a delete and recreate
    // In a production system, you might want a dedicated assignments table
    
    return NextResponse.json({
      success: false,
      message: "Assignment updates not yet implemented. Please delete and recreate.",
    }, { status: 501 });
  } catch (error) {
    console.error("Update teacher assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
