import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from '@/lib/prisma';

// GET - Fetch timetables with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('isActive');


    // Build where clause for database query
    const whereClause: any = {};
    
    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }
    
    if (classId) {
      whereClause.classId = parseInt(classId);
    }
    
    if (academicYearId) {
      whereClause.academicYearId = parseInt(academicYearId);
    }
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    // Fetch timetables from database (exclude legacy virtual)
    const timetables = await prisma.timetable.findMany({
      where: { ...whereClause, buildingName: { not: 'virtual' } },
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get all unique teacher IDs from all timetables
    const allTeacherIds = Array.from(new Set(
      timetables.flatMap(t => t.teacherIds || [])
    ));

    // Fetch teacher details for all teacher IDs
    const teachers = allTeacherIds.length > 0 ? await prisma.teacher.findMany({
      where: {
        id: { in: allTeacherIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherId: true,
        email: true
      }
    }) : [];

    // Create a map for quick teacher lookup
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher]));


    // Group timetables by time slot and day to combine multiple subjects/teachers
    const groupedTimetables = new Map();
    
    timetables.forEach(timetable => {
      const formatTime = (date: Date) => {
        // Use UTC methods to avoid timezone conversion issues
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const timeKey = `${timetable.dayOfWeek}-${formatTime(timetable.startTime)}-${formatTime(timetable.endTime)}-${timetable.classId}-${timetable.roomNumber || ''}`;
      
      
      if (!groupedTimetables.has(timeKey)) {
        groupedTimetables.set(timeKey, {
          id: timetable.id, // Use first timetable ID as primary
          branchId: timetable.branchId,
          classId: timetable.classId,
          academicYearId: timetable.academicYearId,
          dayOfWeek: timetable.dayOfWeek,
          startTime: formatTime(timetable.startTime),
          endTime: formatTime(timetable.endTime),
          roomNumber: timetable.roomNumber,
          buildingName: timetable.buildingName,
          isActive: timetable.isActive,
          createdAt: timetable.createdAt,
          updatedAt: timetable.updatedAt,
          branch: timetable.branch,
          class: timetable.class,
          academicYear: timetable.academicYear,
          subjectIds: [],
          subjects: [],
          teacherIds: [],
          teachers: []
        });
      }
      
      const grouped = groupedTimetables.get(timeKey);
      
      // Add subject if not already present
      if (timetable.subject && !grouped.subjectIds.includes(timetable.subject.id)) {
        grouped.subjectIds.push(timetable.subject.id);
        grouped.subjects.push(timetable.subject);
      }
      
      // Add teachers if not already present
      if (timetable.teacherIds && timetable.teacherIds.length > 0) {
        timetable.teacherIds.forEach(teacherId => {
          if (!grouped.teacherIds.includes(teacherId)) {
            grouped.teacherIds.push(teacherId);
            // Add teacher details if available
            const teacher = teacherMap.get(teacherId);
            if (teacher) {
              grouped.teachers.push(teacher);
            }
          }
        });
      }
    });

    // Convert map to array and sort by start time
    const formattedTimetables = Array.from(groupedTimetables.values()).sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });


    return NextResponse.json({
      timetables: formattedTimetables,
      total: formattedTimetables.length
    });

  } catch (error) {
    console.error('Error fetching timetables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new timetable
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.branchId || !body.classId || !body.academicYearId) {
      return NextResponse.json({ 
        error: 'Missing required fields: branchId, classId, or academicYearId' 
      }, { status: 400 });
    }

    if (!body.startTime || !body.endTime) {
      return NextResponse.json({ 
        error: 'Missing required fields: startTime or endTime' 
      }, { status: 400 });
    }

    if (!body.dayOfWeek) {
      return NextResponse.json({ 
        error: 'Missing required field: dayOfWeek' 
      }, { status: 400 });
    }

    // Validate time format (should be HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.startTime) || !timeRegex.test(body.endTime)) {
      return NextResponse.json({ 
        error: 'Invalid time format. Expected HH:MM format (e.g., 08:30, 14:45)' 
      }, { status: 400 });
    }

    // Handle subject-teacher pairs structure
    const subjectTeacherPairs = body.subjectTeacherPairs || [];
    
    // For backward compatibility, also handle old structure
    if (subjectTeacherPairs.length === 0) {
      const subjectIds = body.subjectIds || (body.subjectId ? [body.subjectId] : []);
      const teacherIds = body.teacherIds || [];
      
      if (subjectIds.length === 0) {
        return NextResponse.json({
          error: 'At least one subject must be specified'
        }, { status: 400 });
      }
      
      // Convert old structure to new structure
      subjectIds.forEach((subjectId: number) => {
        subjectTeacherPairs.push({
          subjectId,
          teacherIds: teacherIds
        });
      });
    }
    
    if (subjectTeacherPairs.length === 0) {
      return NextResponse.json({
        error: 'At least one subject must be specified'
      }, { status: 400 });
    }

    // Validate that all subjects exist
    const allSubjectIds = subjectTeacherPairs.map((pair: any) => pair.subjectId);
    const subjects = await prisma.subject.findMany({
      where: { id: { in: allSubjectIds } }
    });

    if (subjects.length !== allSubjectIds.length) {
      const foundIds = subjects.map((s: any) => s.id);
      const missingIds = allSubjectIds.filter((id: any) => !foundIds.includes(id));
      return NextResponse.json({
        error: `Subjects with IDs ${missingIds.join(', ')} not found`
      }, { status: 400 });
    }

    // Validate that the class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(body.classId) }
    });

    if (!classExists) {
      return NextResponse.json({ 
        error: `Class with ID ${body.classId} not found` 
      }, { status: 400 });
    }

    // Validate that the branch exists
    const branchExists = await prisma.branch.findUnique({
      where: { id: parseInt(body.branchId) }
    });

    if (!branchExists) {
      return NextResponse.json({ 
        error: `Branch with ID ${body.branchId} not found` 
      }, { status: 400 });
    }

    // Validate that the academic year exists
    const academicYearExists = await prisma.academicYear.findUnique({
      where: { id: parseInt(body.academicYearId) }
    });

    if (!academicYearExists) {
      return NextResponse.json({ 
        error: `Academic year with ID ${body.academicYearId} not found` 
      }, { status: 400 });
    }

    // Convert day of week to uppercase to match database enum
    const dayOfWeek = body.dayOfWeek.toUpperCase();
    
    // Validate day of week
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    if (!validDays.includes(dayOfWeek)) {
      return NextResponse.json({ 
        error: `Invalid day of week. Must be one of: ${validDays.join(', ')}` 
      }, { status: 400 });
    }

    // Create timetable entries for each subject-teacher pair
    const timetableEntries = [];
    
    for (const pair of subjectTeacherPairs) {
      const { subjectId, teacherIds } = pair;
      
      // Use provided teachers or auto-assign
      let finalTeacherIds = teacherIds || [];
      
      if (finalTeacherIds.length === 0) {
        // Auto-assign teachers specifically for this subject
        const subjectTeacherAssignments = await prisma.teacherAssignment.findMany({
          where: {
            classId: parseInt(body.classId),
            subjectId: subjectId,
            academicYearId: parseInt(body.academicYearId),
            status: 'ACTIVE',
            role: 'TEACHER'
          },
          include: {
            Teacher: true
          }
        });
        
        finalTeacherIds = subjectTeacherAssignments.map(ta => ta.teacherId);
      }

      const timetableData = {
        branchId: parseInt(body.branchId),
        classId: parseInt(body.classId),
        academicYearId: parseInt(body.academicYearId),
        dayOfWeek: dayOfWeek,
        subjectId: subjectId,
        teacherIds: finalTeacherIds,
        startTime: (() => {
          const [hours, minutes] = body.startTime.split(':').map(Number);
          const utcDate = new Date('1970-01-01T00:00:00.000Z');
          utcDate.setUTCHours(hours, minutes, 0, 0);
          return utcDate;
        })(),
        endTime: (() => {
          const [hours, minutes] = body.endTime.split(':').map(Number);
          const utcDate = new Date('1970-01-01T00:00:00.000Z');
          utcDate.setUTCHours(hours, minutes, 0, 0);
          return utcDate;
        })(),
        roomNumber: body.roomNumber || '',
        buildingName: body.buildingName || '',
        isActive: true,
      };


      const timetableEntry = await prisma.timetable.create({
        data: timetableData,
        include: {
          subject: true,
          class: true,
          branch: true,
          academicYear: true,
        }
      });

      timetableEntries.push(timetableEntry);
    }

    return NextResponse.json({ 
      message: `Timetable entries saved successfully for ${timetableEntries.length} subjects`, 
      data: timetableEntries
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating timetable:', error);

    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A timetable entry with the same details already exists' 
      }, { status: 409 });
    } else if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json({
        error: 'Invalid reference to related data (branch, class, subject, or academic year)'
      }, { status: 400 });
    } else if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({
        error: 'Required related data not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      error: `Failed to create timetable entry: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export const POST = withCSRF(postHandler);

// PUT - Update timetable
async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'Timetable ID is required' 
      }, { status: 400 });
    }

    // Convert time strings to Date objects if provided using UTC
    if (updateData.startTime) {
      const [hours, minutes] = updateData.startTime.split(':').map(Number);
      const utcDate = new Date('1970-01-01T00:00:00.000Z');
      utcDate.setUTCHours(hours, minutes, 0, 0);
      updateData.startTime = utcDate;
    }
    if (updateData.endTime) {
      const [hours, minutes] = updateData.endTime.split(':').map(Number);
      const utcDate = new Date('1970-01-01T00:00:00.000Z');
      utcDate.setUTCHours(hours, minutes, 0, 0);
      updateData.endTime = utcDate;
    }

    // Convert day of week to uppercase if provided
    if (updateData.dayOfWeek) {
      updateData.dayOfWeek = updateData.dayOfWeek.toUpperCase();
    }

    // Auto-assign teachers if teacherIds is being set to empty and we have the necessary info
    if (updateData.teacherIds && updateData.teacherIds.length === 0) {
      // Get the current timetable to get class, subject, and academic year info
      const currentTimetable = await prisma.timetable.findUnique({
        where: { id: parseInt(id) },
        include: {
          subject: true,
          class: true,
          academicYear: true
        }
      });

      if (currentTimetable) {

        const teacherAssignments = await prisma.teacherAssignment.findMany({
          where: {
            classId: currentTimetable.classId,
            subjectId: currentTimetable.subjectId,
            academicYearId: currentTimetable.academicYearId,
            status: 'ACTIVE',
            role: 'TEACHER'
          }
        });

        const teacherIds = teacherAssignments.map(ta => ta.teacherId);
        updateData.teacherIds = teacherIds;
      }
    }

    const updatedTimetable = await prisma.timetable.update({
      where: { id: parseInt(id) },
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
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating timetable:', error);
    return NextResponse.json({ 
      error: 'Failed to update timetable entry' 
    }, { status: 500 });
  }
}

export const PUT = withCSRF(putHandler);

// DELETE - Delete timetable
async function deleteHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Timetable ID is required' 
      }, { status: 400 });
    }

    // Delete timetable (no need to touch attendance or grades - they're independent)
    await prisma.timetable.delete({
      where: { id: parseInt(id) }
    });


    return NextResponse.json({ 
      message: 'Timetable deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting timetable:', error);
    return NextResponse.json({ 
      error: 'Failed to delete timetable entry' 
    }, { status: 500 });
  }
}

export const DELETE = withCSRF(deleteHandler);