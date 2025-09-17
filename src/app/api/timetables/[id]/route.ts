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

    // Helper function to create Date object with time
    const createTimeDate = (timeString: string | Date) => {
      if (!timeString) return undefined;

      // If it's already a Date object, return as is
      if (timeString instanceof Date) {
        return timeString;
      }

      // If it's an ISO string, parse it
      if (typeof timeString === 'string' && timeString.includes('T')) {
        return new Date(timeString);
      }

      // Handle time string format "HH:mm" - use fixed date to avoid timezone issues
      if (typeof timeString === 'string') {
        return new Date(`1970-01-01T${timeString}:00`);
      }

      return undefined;
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
        ...(body.startTime && { startTime: createTimeDate(body.startTime) }),
        ...(body.endTime && { endTime: createTimeDate(body.endTime) }),
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
