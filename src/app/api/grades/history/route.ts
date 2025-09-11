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
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const whereClause: any = {
      classId,
      subjectId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const gradeRecords = await prisma.grade.findMany({
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
      },
      orderBy: [
        { date: 'asc' },
        { student: { firstName: 'asc' } },
      ],
    });

    return NextResponse.json(gradeRecords);
  } catch (error) {
    console.error('Error fetching grade history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grade history' },
      { status: 500 }
    );
  }
}
