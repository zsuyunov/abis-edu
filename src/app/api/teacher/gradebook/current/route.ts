import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    // Build where clause
    const whereClause: any = {
      teacherId: teacherId,
    };

    if (classId) whereClause.classId = parseInt(classId);
    if (subjectId) whereClause.subjectId = parseInt(subjectId);
    if (academicYearId) whereClause.academicYearId = parseInt(academicYearId);
    if (branchId) whereClause.branchId = parseInt(branchId);

    // Get current grades for the teacher
    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
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
        { date: 'desc' },
        { student: { firstName: 'asc' } },
      ],
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error('Error fetching current gradebook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
