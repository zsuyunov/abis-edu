import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 401 });
    }

    // Get teacher's assigned subjects
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacherId,
      },
      include: {
        Subject: true,
      },
      distinct: ['subjectId'],
    });

    const subjects = teacherAssignments
      .filter(assignment => assignment.Subject)
      .map(assignment => ({
        id: assignment.Subject!.id,
        name: assignment.Subject!.name,
      }));

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
