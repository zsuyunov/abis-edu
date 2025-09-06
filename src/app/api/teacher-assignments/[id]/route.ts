import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
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
      const teacherAssignments = await tx.teacher.findUnique({
        where: { id: teacherId },
        select: {
          subjects: {
            where: { id: subjectId },
          },
          classes: {
            where: { id: classId },
          },
        },
      });

      if (teacherAssignments?.subjects.length === 1) {
        // Disconnect teacher from subject if this is their only subject assignment
        await tx.teacher.update({
          where: { id: teacherId },
          data: {
            subjects: {
              disconnect: { id: subjectId },
            },
          },
        });
      }

      if (teacherAssignments?.classes.length === 1) {
        // Disconnect teacher from class if this is their only class assignment
        await tx.teacher.update({
          where: { id: teacherId },
          data: {
            classes: {
              disconnect: { id: classId },
            },
          },
        });
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

export async function PUT(
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
