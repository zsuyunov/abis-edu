import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');


    if (!classId || !subjectId || !month) {
      return NextResponse.json(
        { error: 'Class ID, Subject ID, and month are required' },
        { status: 400 }
      );
    }

    // Parse month to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    // Use a broader date range to account for timezone differences
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);


    const whereClause: any = {
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      // Use a more flexible date range to handle timezone issues
      date: {
        gte: new Date(year, monthNum - 1, 1), // Start of month
        lt: new Date(year, monthNum, 1),      // Start of next month
      },
    };

    if (academicYearId) {
      whereClause.academicYearId = parseInt(academicYearId);
    }

    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }


    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        timetable: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            dayOfWeek: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { timetable: { startTime: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });

    if (attendanceRecords.length > 0) {
    }

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance history' },
      { status: 500 }
    );
  }
}
