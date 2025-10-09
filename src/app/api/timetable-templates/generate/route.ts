import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      branchId,
      classId,
      academicYearId,
      subjectId,
      teacherId,
      startDate,
      endDate,
      roomNumber,
      buildingName,
      status = "ACTIVE",
      weekdaySchedules
    } = body;

    // Validate required fields
    if (!branchId || !classId || !academicYearId || !subjectId || !teacherId || 
        !startDate || !endDate || !roomNumber || !weekdaySchedules || weekdaySchedules.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timetableEntries = [];

    // Generate timetable entries for each date in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      
      // Find schedule for this day of week
      const daySchedule = weekdaySchedules.find((schedule: any) => 
        schedule.day === dayOfWeek && schedule.enabled
      );
      
      if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
        // Create start and end datetime objects
      const startDateTime = new Date(date);
        const [startHour, startMinute] = daySchedule.startTime.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const endDateTime = new Date(date);
        const [endHour, endMinute] = daySchedule.endTime.split(':');
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

        timetableEntries.push({
          branchId,
          classId,
          academicYearId,
          subjectId,
          teacherId,
          fullDate: new Date(date),
          day: dayOfWeek,
          startTime: startDateTime,
          endTime: endDateTime,
          roomNumber,
          buildingName: buildingName || null,
          status,
        });
      }
    }

    if (timetableEntries.length === 0) {
    return NextResponse.json(
        { error: "No timetable entries would be created with the current settings" },
        { status: 400 }
      );
    }

    // Create all timetable entries
    const createdEntries = await prisma.timetable.createMany({
      data: timetableEntries,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      count: createdEntries.count,
      message: `Successfully created ${createdEntries.count} timetable entries`
    });

  } catch (error) {
    console.error("Error generating recurring timetables:", error);
    return NextResponse.json(
      { error: "Failed to generate recurring timetables" },
      { status: 500 }
    );
  }
}

export const POST = withCSRF(postHandler);