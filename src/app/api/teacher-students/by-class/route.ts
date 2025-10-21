import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

const prisma = new PrismaClient();

export const GET = authenticateJWT(authorizeRole('TEACHER')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = request.headers.get("x-user-id");

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Verify that the teacher is assigned to this class
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherId,
        classId: parseInt(classId),
        status: 'ACTIVE'
      }
    });

    if (!teacherAssignment) {
      return NextResponse.json({ 
        error: 'You are not assigned to this class' 
      }, { status: 403 });
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

    return NextResponse.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students by class for teacher:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}));
