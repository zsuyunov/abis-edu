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

    console.log('Timetables found:', timetables.length);

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
      
      console.log(`Processing timetable ID ${timetable.id}:`);
      console.log(`  Subject: ${timetable.subject?.name} (ID: ${timetable.subjectId})`);
      console.log(`  Teachers: [${timetable.teacherIds.join(', ')}]`);
      console.log(`  Time Key: ${timeKey}`);
      
      if (!groupedTimetables.has(timeKey)) {
        console.log(`  Creating new group for time key: ${timeKey}`);
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
        console.log(`  Added subject: ${timetable.subject.name} to group`);
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
              console.log(`  Added teacher: ${teacher.firstName} ${teacher.lastName} to group`);
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

    console.log('Grouped timetables:', formattedTimetables.length);
    
    // Log each grouped timetable
    formattedTimetables.forEach((timetable, index) => {
      console.log(`Grouped Timetable ${index + 1}:`);
      console.log(`  Subjects: [${timetable.subjects.map((s: any) => s.name).join(', ')}]`);
      console.log(`  Teachers: [${timetable.teachers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')}]`);
      console.log(`  Day: ${timetable.dayOfWeek}, Time: ${timetable.startTime}-${timetable.endTime}`);
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

    if (subjectIds.length === 0) {
      return NextResponse.json({
        error: 'At least one subject must be specified'
      }, { status: 400 });
    }

    // Validate that all subjects exist
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } }
    });

    if (subjects.length !== subjectIds.length) {
      const foundIds = subjects.map((s: any) => s.id);
      const missingIds = subjectIds.filter((id: any) => !foundIds.includes(id));
      return NextResponse.json({
        error: `Subjects with IDs ${missingIds.join(', ')} not found`
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

    // Create timetable entries for each subject
    const timetableEntries = [];
    
    for (const subjectId of subjectIds) {
      // For each subject, find teachers specifically assigned to that subject
      let subjectTeacherIds = [];
      
      // If specific teachers were selected, use them for all subjects
      if (teacherIds.length > 0) {
        subjectTeacherIds = teacherIds;
      } else {
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
        
        subjectTeacherIds = subjectTeacherAssignments.map(ta => ta.teacherId);
        console.log(`📚 Subject ${subjectId} assigned teachers: [${subjectTeacherIds.join(', ')}]`);
      }

      const timetableData = {
        branchId: parseInt(body.branchId),
        classId: parseInt(body.classId),
        academicYearId: parseInt(body.academicYearId),
        dayOfWeek: dayOfWeek,
        subjectId: subjectId,
        teacherIds: subjectTeacherIds,
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

      console.log(`Creating timetable for subject ${subjectId} with data:`, timetableData);

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
      console.log(`Timetable created successfully for subject ${subjectId} with ID:`, timetableEntry.id);
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

    // First, delete all related attendance records
    await prisma.attendance.deleteMany({
      where: {
        timetableId: parseInt(id)
      }
    });

    // Then delete the timetable
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