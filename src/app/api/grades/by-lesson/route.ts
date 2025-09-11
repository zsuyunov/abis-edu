import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const date = searchParams.get('date');

    if (!classId || !subjectId || !date) {
      return NextResponse.json(
        { error: 'Class ID, Subject ID, and date are required' },
        { status: 400 }
      );
    }

    const grades = await prisma.grade.findMany({
      where: {
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        date: new Date(date),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades by lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
