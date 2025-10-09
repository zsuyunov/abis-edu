import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
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

    // Format times correctly for display using UTC to avoid timezone issues
    const formatTime = (date: Date) => {
      // Use UTC methods to avoid timezone conversion issues
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const formattedTimetable = {
      ...timetable,
      startTime: formatTime(timetable.startTime),
      endTime: formatTime(timetable.endTime),
    };

    return NextResponse.json(formattedTimetable);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
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

    // Helper function to create Date object with time, using UTC to avoid timezone issues
    const createTimeDate = (timeString: string | Date) => {
      if (!timeString) return undefined;

      if (timeString instanceof Date) {
        return timeString;
      }

      if (typeof timeString === 'string') {
        // If it's an ISO string, parse it as is
        if (timeString.includes('T')) {
          return new Date(timeString);
        }

        // Handle time string format "HH:mm" - create in UTC to avoid timezone issues
        const [hours, minutes] = timeString.split(':').map(Number);
        const utcDate = new Date('1970-01-01T00:00:00.000Z'); // Start with UTC date
        utcDate.setUTCHours(hours, minutes, 0, 0); // Set hours and minutes in UTC
        return utcDate;
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
        ...(body.startTime && { startTime: createTimeDate(body.startTime) || new Date('1970-01-01T00:00:00.000Z') }),
        ...(body.endTime && { endTime: createTimeDate(body.endTime) || new Date('1970-01-01T00:00:00.000Z') }),
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

    // Format times correctly for display using UTC to avoid timezone issues
    const formatTime = (date: Date) => {
      // Use UTC methods to avoid timezone conversion issues
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const formattedTimetable = {
      ...timetable,
      startTime: formatTime(timetable.startTime),
      endTime: formatTime(timetable.endTime),
    };

    return NextResponse.json(formattedTimetable);
  } catch (error) {
    console.error("Error updating timetable:", error);
    return NextResponse.json(
      { error: "Failed to update timetable" },
      { status: 500 }
    );
  }
}

export const PUT = withCSRF(putHandler);

async function deleteHandler(
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
    if (_count.Exam > 0) {
      return NextResponse.json(
        { error: "Cannot delete timetable with associated exams" },
        { status: 400 }
      );
    }

    // First, delete all related attendance records
    await prisma.attendance.deleteMany({
      where: {
        timetableId: parseInt(params.id)
      }
    });

    // Then delete the timetable
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

export const DELETE = withCSRF(deleteHandler);
