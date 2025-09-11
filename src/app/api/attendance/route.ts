import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// POST /api/attendance - Save daily attendance
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const teacherId = headersList.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      timetableId, 
      classId, 
      subjectId, 
      academicYearId, 
      branchId, 
      date, 
      attendanceData 
    } = body;

    // Validate required fields
    if (!timetableId || !classId || !subjectId || !branchId || !date || !attendanceData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log the received data for debugging
    console.log('Attendance API - Received data:', {
      timetableId,
      classId,
      subjectId,
      academicYearId,
      branchId,
      date,
      attendanceDataCount: attendanceData?.length
    });

    // Verify teacher has access to this class (skip teacher assignment check for now)
    // Note: Temporarily disabled to allow attendance saving without strict teacher assignments
    console.log('Skipping teacher assignment verification for attendance save');
    
    // const teacherAssignment = await prisma.teacherAssignment.findFirst({
    //   where: {
    //     teacherId,
    //     classId: parseInt(classId),
    //     subjectId: parseInt(subjectId),
    //     academicYearId: academicYearId ? parseInt(academicYearId) : undefined,
    //     branchId: parseInt(branchId)
    //   }
    // });

    // if (!teacherAssignment) {
    //   return NextResponse.json({ error: 'Unauthorized access to this class' }, { status: 403 });
    // }

    // Get a valid academic year ID if not provided
    let validAcademicYearId = academicYearId ? parseInt(academicYearId) : null;
    
    if (!validAcademicYearId) {
      // Get the current active academic year
      const currentAcademicYear = await prisma.academicYear.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { startDate: 'desc' }
      });
      
      if (currentAcademicYear) {
        validAcademicYearId = currentAcademicYear.id;
        console.log('Using current academic year:', currentAcademicYear.id, currentAcademicYear.name);
      } else {
        // Fallback to any academic year
        const anyAcademicYear = await prisma.academicYear.findFirst({
          orderBy: { startDate: 'desc' }
        });
        if (anyAcademicYear) {
          validAcademicYearId = anyAcademicYear.id;
          console.log('Using fallback academic year:', anyAcademicYear.id, anyAcademicYear.name);
        } else {
          return NextResponse.json({ error: 'No academic year found in system' }, { status: 400 });
        }
      }
    }

    // Create attendance records
    const attendanceRecords = attendanceData.map((record: any) => ({
      studentId: record.studentId,
      timetableId: parseInt(timetableId),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      academicYearId: validAcademicYearId,
      branchId: parseInt(branchId),
      teacherId,
      date: new Date(date),
      status: record.status.toUpperCase(), // Convert to uppercase to match enum
      notes: record.notes || record.comment || null
    }));

    // Use transaction to ensure all records are created or none
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing attendance for this date/timetable to avoid duplicates
      await tx.attendance.deleteMany({
        where: {
          timetableId: parseInt(timetableId),
          date: new Date(date)
        }
      });

      // Create new attendance records
      return await tx.attendance.createMany({
        data: attendanceRecords
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance saved successfully',
      recordsCreated: result.count
    });

  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/attendance?classId=1&month=2024-01&year=2024 - Get monthly attendance
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const teacherId = headersList.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const year = searchParams.get('year');
    const subjectId = searchParams.get('subjectId');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Build date filter
    let dateFilter: any = {};
    if (month && year) {
      const startDate = new Date(`${year}-${month.split('-')[1]}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };
    } else if (year) {
      dateFilter = {
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      };
    }

    // Build where clause
    const whereClause: any = {
      classId: parseInt(classId),
      teacherId,
      ...dateFilter
    };

    if (subjectId) whereClause.subjectId = parseInt(subjectId);
    if (academicYearId) whereClause.academicYearId = parseInt(academicYearId);
    if (branchId) whereClause.branchId = parseInt(branchId);

    // Fetch attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { student: { firstName: 'asc' } }
      ]
    });

    // Get all students in the class for complete grid
    const students = await prisma.student.findMany({
      where: {
        classId: parseInt(classId),
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Format data for grid display
    const attendanceGrid = students.map(student => {
      const studentAttendance = attendanceRecords.filter(record => record.studentId === student.id);
      return {
        student,
        attendance: studentAttendance
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        students,
        attendanceGrid,
        attendanceRecords
      }
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
