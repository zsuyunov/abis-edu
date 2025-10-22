import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import prisma from '@/lib/prisma';

// PUT - Update timetable with multiple subject-teacher entries
async function putHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { entries, originalTimetableId } = body;

    // Get the original timetable to understand the time slot
    const originalTimetable = await prisma.timetable.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      }
    });

    if (!originalTimetable) {
      return NextResponse.json({ 
        error: 'Original timetable not found' 
      }, { status: 404 });
    }

    // Find all timetables in the same time slot (to be replaced)
    const timeSlotTimetables = await prisma.timetable.findMany({
      where: {
        dayOfWeek: originalTimetable.dayOfWeek,
        startTime: originalTimetable.startTime,
        endTime: originalTimetable.endTime,
        classId: originalTimetable.classId,
        roomNumber: originalTimetable.roomNumber,
        branchId: originalTimetable.branchId,
        academicYearId: originalTimetable.academicYearId,
      }
    });

    // Delete all existing timetables in this time slot
    await prisma.timetable.deleteMany({
      where: {
        id: { in: timeSlotTimetables.map(t => t.id) }
      }
    });

    // Create new timetables for each subject-teacher entry
    const newTimetables = [];
    
    for (const entry of entries) {
      // Convert time strings to Date objects
      let startTimeDate, endTimeDate;
      
      if (entry.startTime) {
        // Handle both HH:MM and HH:MM:SS formats
        const timeStr = entry.startTime.includes(':') ? entry.startTime : `${entry.startTime}:00`;
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          // Use UTC to avoid timezone conversion issues
          startTimeDate = new Date(`1970-01-01T${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00.000Z`);
        } else {
          startTimeDate = originalTimetable.startTime;
        }
      } else {
        startTimeDate = originalTimetable.startTime;
      }
      
      if (entry.endTime) {
        // Handle both HH:MM and HH:MM:SS formats
        const timeStr = entry.endTime.includes(':') ? entry.endTime : `${entry.endTime}:00`;
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          // Use UTC to avoid timezone conversion issues
          endTimeDate = new Date(`1970-01-01T${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00.000Z`);
        } else {
          endTimeDate = originalTimetable.endTime;
        }
      } else {
        endTimeDate = originalTimetable.endTime;
      }

      // Auto-assign teachers if none provided
      let finalTeacherIds = entry.teacherIds || [];
      
      if (finalTeacherIds.length === 0) {
        const teacherAssignments = await prisma.teacherAssignment.findMany({
          where: {
            classId: entry.classId,
            subjectId: entry.subjectId,
            academicYearId: entry.academicYearId,
            status: 'ACTIVE',
            role: 'TEACHER'
          }
        });
        
        finalTeacherIds = teacherAssignments.map(ta => ta.teacherId);
      }

      const timetableData = {
        branchId: entry.branchId,
        classId: entry.classId,
        academicYearId: entry.academicYearId,
        dayOfWeek: entry.dayOfWeek || originalTimetable.dayOfWeek,
        startTime: startTimeDate,
        endTime: endTimeDate,
        roomNumber: entry.roomNumber || originalTimetable.roomNumber,
        buildingName: entry.buildingName || originalTimetable.buildingName,
        subjectId: entry.subjectId,
        teacherIds: finalTeacherIds,
        isActive: true
      };

      const newTimetable = await prisma.timetable.create({
        data: timetableData,
        include: {
          subject: true,
          class: true,
          branch: true,
          academicYear: true,
        }
      });

      newTimetables.push(newTimetable);
    }

    return NextResponse.json({ 
      message: 'Timetables updated successfully with multiple subject-teacher entries', 
      data: newTimetables[0], // Return the first one as the main result
      allTimetables: newTimetables,
      count: newTimetables.length
    });

  } catch (error) {
    console.error('Error updating timetables with multiple entries:', error);
    return NextResponse.json({ 
      error: 'Failed to update timetables with multiple entries' 
    }, { status: 500 });
  }
}

export const PUT = authenticateJWT(authorizeRole('ADMIN')(withCSRF(putHandler)));
