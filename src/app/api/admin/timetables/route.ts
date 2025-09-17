import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch timetables with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('isActive');

    console.log('GET /api/admin/timetables called with params:', { branchId, classId, academicYearId, isActive });

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

    // Fetch timetables from database
    const timetables = await prisma.timetable.findMany({
      where: whereClause,
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

    console.log('Timetables found:', timetables.length);

    // Format times correctly for display using UTC to avoid timezone issues
    const formattedTimetables = timetables.map(timetable => {
      const formatTime = (date: Date) => {
        // Use UTC methods to avoid timezone conversion issues
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      return {
        ...timetable,
        startTime: formatTime(timetable.startTime),
        endTime: formatTime(timetable.endTime),
      };
    });

    return NextResponse.json({
      timetables: formattedTimetables,
      total: timetables.length
    });

  } catch (error) {
    console.error('Error fetching timetables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new timetable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received timetable data:', body);
    
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

    // Handle both single subject and multiple subjects
    const subjectIds = body.subjectIds || (body.subjectId ? [body.subjectId] : []);
    const primarySubjectId = subjectIds.length > 0 ? subjectIds[0] : null;

    if (!primarySubjectId) {
      return NextResponse.json({
        error: 'At least one subject must be specified'
      }, { status: 400 });
    }

    // Validate that the subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: primarySubjectId }
    });

    if (!subject) {
      return NextResponse.json({
        error: `Subject with ID ${primarySubjectId} not found`
      }, { status: 400 });
    }

    // Auto-assign teachers based on TeacherAssignment records if no teachers specified
    let teacherIds = body.teacherIds || [];
    if (teacherIds.length === 0) {
      console.log('🔍 No teachers specified, auto-assigning based on TeacherAssignment records...');

      // Find teachers assigned to ANY of the selected subjects for this class
      const teacherAssignments = await prisma.teacherAssignment.findMany({
        where: {
          classId: parseInt(body.classId),
          subjectId: { in: subjectIds }, // Check all selected subjects
          academicYearId: parseInt(body.academicYearId),
          status: 'ACTIVE',
          role: 'TEACHER'
        },
        include: {
          Teacher: true
        }
      });

      // Get unique teacher IDs
      const uniqueTeacherIds = Array.from(new Set(teacherAssignments.map(ta => ta.teacherId)));
      teacherIds = uniqueTeacherIds;
      console.log(`✅ Auto-assigned ${teacherIds.length} teachers: [${teacherIds.join(', ')}]`);
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

    // Create timetable entry in database
    const timetableData = {
      branchId: parseInt(body.branchId),
      classId: parseInt(body.classId),
      academicYearId: parseInt(body.academicYearId),
      dayOfWeek: dayOfWeek,
      subjectId: primarySubjectId,
      teacherIds: teacherIds, // Use auto-assigned teachers
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

    console.log('Creating timetable with data:', timetableData);

    const timetableEntry = await prisma.timetable.create({
      data: timetableData,
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      }
    });

    console.log('Timetable created successfully with ID:', timetableEntry.id);

    return NextResponse.json({ 
      message: 'Timetable entry saved successfully', 
      data: timetableEntry
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

// PUT - Update timetable
export async function PUT(request: NextRequest) {
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
        console.log('🔍 Auto-assigning teachers for timetable update...');

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
        console.log(`✅ Auto-assigned ${teacherIds.length} teachers for update: [${teacherIds.join(', ')}]`);
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

    console.log('Timetable updated successfully:', updatedTimetable.id);

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

// DELETE - Delete timetable
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Timetable ID is required' 
      }, { status: 400 });
    }

    await prisma.timetable.delete({
      where: { id: parseInt(id) }
    });

    console.log('Timetable deleted successfully:', id);

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