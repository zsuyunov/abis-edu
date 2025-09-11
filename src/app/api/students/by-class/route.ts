import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Fetch students by class ID
    const students = await prisma.student.findMany({
      where: {
        classId: parseInt(classId),
        archivedAt: null // Only active students
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        status: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
