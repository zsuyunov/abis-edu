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
        Exam: {
          select: { id: true, name: true, startTime: true, endTime: true }
        },
        Attendance: {
          select: { id: true, date: true, status: true, student: { select: { firstName: true, lastName: true } } }
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
    
    // Fix timezone issue: Create local time instead of UTC
    const createLocalTime = (timeInput: string | Date) => {
      if (typeof timeInput === 'string') {
        // If it's a time string like "08:30", convert to local time
        if (timeInput.includes(':') && !timeInput.includes('T')) {
          const [hours, minutes] = timeInput.split(':').map(Number);
          return new Date(1970, 0, 1, hours, minutes, 0, 0);
        }
        // If it's a full date string, use it as is
        return new Date(timeInput);
      }
      return timeInput;
    };
    
    const timetable = await prisma.timetable.update({
      where: { id: parseInt(params.id) },
      data: {
        branchId: body.branchId,
        classId: body.classId,
        academicYearId: body.academicYearId,
        subjectId: body.subjectId,
        teacherIds: body.teacherId ? [body.teacherId] : [],
        dayOfWeek: body.dayOfWeek,
        startTime: createLocalTime(body.startTime),
        endTime: createLocalTime(body.endTime),
        roomNumber: body.roomNumber,
        buildingName: body.buildingName || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
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
            Exam: true,
            Attendance: true,
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
    if (_count.Exam > 0 || _count.Attendance > 0) {
      return NextResponse.json(
        { error: "Cannot delete timetable with associated exams or attendances" },
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
