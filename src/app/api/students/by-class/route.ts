import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('TEACHER', 'ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // For teachers, verify they are assigned to this class
    if (userRole === 'TEACHER') {
      const teacherAssignment = await prisma.teacherAssignment.findFirst({
        where: {
          teacherId: userId,
          classId: parseInt(classId),
          status: 'ACTIVE'
        }
      });

      if (!teacherAssignment) {
        return NextResponse.json({ 
          error: 'You are not assigned to this class' 
        }, { status: 403 });
      }
    }
    
    // For admins, no additional verification needed

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

    return NextResponse.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  } finally {
    // Don't disconnect the shared Prisma client
    // await prisma.$disconnect();
  }
}));
