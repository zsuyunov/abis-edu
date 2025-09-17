import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// POST /api/teacher-grades - Save grades for a lesson
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
      branchId,
      academicYearId,
      classId,
      subjectId,
      type,
      date,
      maxScore,
      assignmentTitle,
      records
    } = body;

    // Validate required fields
    if (!timetableId || !branchId || !classId || !subjectId || !date || !records) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log the received data for debugging
    console.log('Grade API - Received data:', {
      timetableId,
        branchId,
        academicYearId,
        classId,
        subjectId,
      type,
      date,
      maxScore,
      assignmentTitle,
      recordsCount: records?.length
    });

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

    // Filter out records with 0 or invalid scores
    const validRecords = records.filter((record: any) => 
      record && 
      record.studentId && 
      record.score && 
      parseFloat(record.score) > 0
    );

    console.log('Valid records after filtering:', validRecords.length, 'out of', records.length);

    if (validRecords.length === 0) {
      return NextResponse.json({ 
        error: 'No valid grade records provided. Please enter at least one grade with a score greater than 0.' 
      }, { status: 400 });
    }

    // Create grade records
    const gradeRecords = validRecords.map((record: any) => ({
      studentId: record.studentId,
      timetableId: parseInt(timetableId),
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      academicYearId: validAcademicYearId,
      branchId: parseInt(branchId),
      teacherId,
      date: new Date(date),
      value: parseFloat(record.score),
      maxValue: parseFloat(maxScore) || 100,
      type: type || 'DAILY_GRADE',
      description: record.feedback || assignmentTitle || 'Daily Grade',
      week: Math.ceil(new Date(date).getDate() / 7),
      month: new Date(date).getMonth() + 1,
      year: new Date(date).getFullYear()
    }));

    // Use transaction to ensure all records are created or none
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing grades for this date/timetable to avoid duplicates
      await tx.grade.deleteMany({
        where: {
          timetableId: parseInt(timetableId),
          date: new Date(date)
        }
      });

      // Create new grade records
      return await tx.grade.createMany({
        data: gradeRecords
      });
      });

      return NextResponse.json({
        success: true,
      message: 'Grades saved successfully',
      recordsCreated: result.count
      });

  } catch (error) {
    console.error('Error saving grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/teacher-grades - Get grades for teacher's classes
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const teacherId = headersList.get('x-user-id');

    if (!teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      teacherId
    };

    if (classId) whereClause.classId = parseInt(classId);
    if (subjectId) whereClause.subjectId = parseInt(subjectId);
    if (academicYearId) whereClause.academicYearId = parseInt(academicYearId);
    if (branchId) whereClause.branchId = parseInt(branchId);

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch grade records
    const gradeRecords = await prisma.grade.findMany({
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
        },
        timetable: {
          select: {
            id: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { student: { firstName: 'asc' } }
      ]
    });

    // Get unique students for grid display
    const uniqueStudents = Array.from(
      new Set(gradeRecords.map(record => record.student.id))
    ).map(studentId => {
      const record = gradeRecords.find(r => r.student.id === studentId);
      return record?.student;
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        gradeRecords,
        students: uniqueStudents,
        totalRecords: gradeRecords.length
      }
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}