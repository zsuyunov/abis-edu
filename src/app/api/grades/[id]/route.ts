import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true,
            class: { select: { name: true } },
            branch: { select: { shortName: true } }
          } 
        },
        subject: { select: { name: true } },
        teacher: { 
          select: { 
            firstName: true, 
            lastName: true 
          } 
        },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
        timetable: {
          select: {
            id: true,
            fullDate: true,
            startTime: true,
            endTime: true,
            roomNumber: true,
            buildingName: true,
          }
        },
        archiveComments: {
          select: {
            comment: true,
            action: true,
            createdBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" }
        },
      },
    });

    if (!grade) {
      return NextResponse.json(
        { error: "Grade not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(grade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade" },
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
    
    const grade = await prisma.grade.update({
      where: { id: parseInt(params.id) },
      data: {
        value: body.value,
        maxValue: body.maxValue || 100,
        type: body.type,
        description: body.description || null,
        date: new Date(body.date),
        week: body.week || null,
        month: body.month || null,
        term: body.term || null,
        year: body.year,
        studentId: body.studentId,
        branchId: body.branchId,
        classId: body.classId,
        academicYearId: body.academicYearId,
        subjectId: body.subjectId,
        teacherId: body.teacherId,
        timetableId: body.timetableId || null,
        status: body.status || "ACTIVE",
      },
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true
          } 
        },
        subject: { select: { name: true } },
        teacher: { 
          select: { 
            firstName: true, 
            lastName: true 
          } 
        },
      },
    });
    
    return NextResponse.json(grade);
  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Failed to update grade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.grade.delete({
      where: { id: parseInt(params.id) },
    });
    
    return NextResponse.json({ message: "Grade deleted successfully" });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 }
    );
  }
}
