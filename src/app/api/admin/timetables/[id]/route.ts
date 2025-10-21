import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import prisma from '@/lib/prisma';

// GET - Fetch single timetable
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      }
    });

    if (!timetable) {
      return NextResponse.json({ 
        error: 'Timetable not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ data: timetable });

  } catch (error) {
    console.error('Error fetching timetable:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update timetable (handles single to multiple subjects transition)
async function putHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { subjectIds, teacherIds, startTime, endTime, dayOfWeek, ...otherData } = body;

    // Get the current timetable to understand its structure
    const currentTimetable = await prisma.timetable.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      }
    });

    if (!currentTimetable) {
      return NextResponse.json({ 
        error: 'Timetable not found' 
      }, { status: 404 });
    }

    // Convert time strings to Date objects if provided
    let startTimeDate, endTimeDate;
    if (startTime) {
      startTimeDate = new Date(`1970-01-01T${startTime}:00`);
    }
    if (endTime) {
      endTimeDate = new Date(`1970-01-01T${endTime}:00`);
    }

    // Convert day of week to uppercase if provided
    const dayOfWeekUpper = dayOfWeek ? dayOfWeek.toUpperCase() : currentTimetable.dayOfWeek;

    // If we have subjectIds (multiple subjects), we need to handle the transition
    if (subjectIds && subjectIds.length > 0) {
      // Find all timetables that share the same time slot (same day, time, class, room)
      const timeSlotTimetables = await prisma.timetable.findMany({
        where: {
          dayOfWeek: dayOfWeekUpper || currentTimetable.dayOfWeek,
          startTime: startTimeDate || currentTimetable.startTime,
          endTime: endTimeDate || currentTimetable.endTime,
          classId: currentTimetable.classId,
          roomNumber: currentTimetable.roomNumber,
          branchId: currentTimetable.branchId,
          academicYearId: currentTimetable.academicYearId,
        }
      });

      // Delete all existing timetables in this time slot (attendance and grades are independent)
      await prisma.timetable.deleteMany({
        where: {
          id: { in: timeSlotTimetables.map(t => t.id) }
        }
      });

      // Create new timetables for each subject
      const newTimetables = [];
      for (const subjectId of subjectIds) {
        // Determine teachers for this subject
        let subjectTeacherIds = [];
        
        if (teacherIds && teacherIds.length > 0) {
          // Use manually selected teachers from the form
          // Filter to only include teachers that are actually assigned to this subject
          const subjectTeacherAssignments = await prisma.teacherAssignment.findMany({
            where: {
              classId: currentTimetable.classId || undefined,
              subjectId: subjectId,
              academicYearId: currentTimetable.academicYearId,
              status: 'ACTIVE',
              role: 'TEACHER',
              teacherId: { in: teacherIds }
            }
          });
          
          subjectTeacherIds = subjectTeacherAssignments.map(ta => ta.teacherId);
          console.log(`👨‍🏫 Subject ${subjectId} using selected teachers: [${subjectTeacherIds.join(', ')}]`);
          
          // If no valid teachers found from selection, fall back to auto-assignment
          if (subjectTeacherIds.length === 0) {
            const allSubjectTeachers = await prisma.teacherAssignment.findMany({
              where: {
                classId: currentTimetable.classId || undefined,
                subjectId: subjectId,
                academicYearId: currentTimetable.academicYearId,
                status: 'ACTIVE',
                role: 'TEACHER'
              }
            });
            subjectTeacherIds = allSubjectTeachers.map(ta => ta.teacherId);
            console.log(`🔄 Subject ${subjectId} fallback to auto-assigned teachers: [${subjectTeacherIds.join(', ')}]`);
          }
        } else {
          // Auto-assign teachers specifically for THIS subject
          const subjectTeacherAssignments = await prisma.teacherAssignment.findMany({
            where: {
              classId: currentTimetable.classId || undefined,
              subjectId: subjectId,
              academicYearId: currentTimetable.academicYearId,
              status: 'ACTIVE',
              role: 'TEACHER'
            }
          });
          
          subjectTeacherIds = subjectTeacherAssignments.map(ta => ta.teacherId);
          console.log(`📚 Subject ${subjectId} auto-assigned teachers: [${subjectTeacherIds.join(', ')}]`);
        }

        const timetableData = {
          branchId: currentTimetable.branchId,
          classId: currentTimetable.classId,
          academicYearId: currentTimetable.academicYearId,
          dayOfWeek: dayOfWeekUpper || currentTimetable.dayOfWeek,
          startTime: startTimeDate || currentTimetable.startTime,
          endTime: endTimeDate || currentTimetable.endTime,
          roomNumber: currentTimetable.roomNumber,
          buildingName: currentTimetable.buildingName,
          subjectId: subjectId,
          teacherIds: subjectTeacherIds,
          isActive: currentTimetable.isActive,
          ...otherData
        };
        
        console.log(`💾 Creating timetable for subject ${subjectId}:`, {
          day: timetableData.dayOfWeek,
          room: timetableData.roomNumber,
          teachers: subjectTeacherIds
        });
        
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
        message: 'Timetable updated successfully', 
        data: newTimetables[0], // Return the first one as the main result
        allTimetables: newTimetables // Include all created timetables
      });
    } else {
      // Single subject update - update the existing timetable
      const updateData: any = { ...otherData };
      
      if (startTimeDate) updateData.startTime = startTimeDate;
      if (endTimeDate) updateData.endTime = endTimeDate;
      if (dayOfWeekUpper) updateData.dayOfWeek = dayOfWeekUpper;
      if (teacherIds) updateData.teacherIds = teacherIds;

      const updatedTimetable = await prisma.timetable.update({
        where: { id: parseInt(params.id) },
        data: updateData,
        include: {
          subject: true,
          class: true,
          branch: true,
          academicYear: true,
        }
      });

      return NextResponse.json({ 
        message: 'Timetable updated successfully', 
        data: updatedTimetable
      });
    }

  } catch (error) {
    console.error('Error updating timetable:', error);
    return NextResponse.json({ 
      error: 'Failed to update timetable' 
    }, { status: 500 });
  }
}

export const PUT = authenticateJWT(authorizeRole('ADMIN')(withCSRF(putHandler)));

// DELETE - Delete single timetable
async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timetableId = parseInt(params.id);

    // Delete the timetable (attendance/grades are independent now)
    await prisma.timetable.delete({
      where: { id: timetableId }
    });

    return NextResponse.json({ 
      message: 'Timetable deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting timetable:', error);
    return NextResponse.json({ 
      error: 'Failed to delete timetable' 
    }, { status: 500 });
  }
}

export const DELETE = authenticateJWT(authorizeRole('ADMIN')(withCSRF(deleteHandler)));