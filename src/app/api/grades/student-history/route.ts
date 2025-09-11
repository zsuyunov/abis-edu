import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!studentId || !month) {
      return NextResponse.json(
        { error: 'Student ID and month are required' },
        { status: 400 }
      );
    }

    // Parse month to get start and end dates
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const whereClause: any = {
      studentId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (subjectId) {
      whereClause.subjectId = subjectId;
    }

    const gradeRecords = await prisma.grade.findMany({
      where: whereClause,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json(gradeRecords);
  } catch (error) {
    console.error('Error fetching student grade history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grade history' },
      { status: 500 }
    );
  }
}
