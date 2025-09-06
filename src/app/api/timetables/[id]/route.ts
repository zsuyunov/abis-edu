import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { 
          select: { 
                        id: true,
            firstName: true, 
            lastName: true
          } 
        },
        exams: {
          select: { id: true, title: true, startTime: true, endTime: true }
        },
        assignments: {
          select: { id: true, title: true, startDate: true, dueDate: true }
        },
        attendances: {
          select: { id: true, date: true, present: true, student: { select: { firstName: true, lastName: true } } }
        }
      },
    });

    if (!timetable) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(timetable);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
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
    
    const timetable = await prisma.timetable.update({
      where: { id: parseInt(params.id) },
      data: {
        branchId: body.branchId,
        classId: body.classId,
        academicYearId: body.academicYearId,
        subjectId: body.subjectId,
        teacherId: body.teacherId,
        fullDate: new Date(body.fullDate),
        day: body.day,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        roomNumber: body.roomNumber,
        buildingName: body.buildingName || null,
        status: body.status,
      },
      include: {
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { 
          select: { 
                        id: true,
            firstName: true, 
            lastName: true
          } 
        },
      },
    });
    
    return NextResponse.json(timetable);
  } catch (error) {
    console.error("Error updating timetable:", error);
    return NextResponse.json(
      { error: "Failed to update timetable" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for related records first
    const relatedRecords = await prisma.timetable.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        _count: {
          select: {
            exams: true,
            assignments: true,
            attendances: true,
          }
        }
      }
    });

    if (!relatedRecords) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    const { _count } = relatedRecords;
    if (_count.exams > 0 || _count.assignments > 0 || _count.attendances > 0) {
      return NextResponse.json(
        { error: "Cannot delete timetable with associated exams, assignments, or attendances" },
        { status: 400 }
      );
    }

    await prisma.timetable.delete({
      where: { id: parseInt(params.id) },
    });
    
    return NextResponse.json({ message: "Timetable deleted successfully" });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable" },
      { status: 500 }
    );
  }
}
