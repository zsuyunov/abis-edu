import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET - Get students available for assignment to an elective subject
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const classIds = searchParams.get('classIds'); // Comma-separated list
    const electiveSubjectId = searchParams.get('electiveSubjectId');

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    // Get already assigned students for this elective subject
    let assignedStudentIds: string[] = [];
    if (electiveSubjectId) {
      const assignedStudents = await prisma.electiveStudentAssignment.findMany({
        where: {
          electiveSubjectId: parseInt(electiveSubjectId),
          status: 'ACTIVE'
        },
        select: {
          studentId: true
        }
      });
      assignedStudentIds = assignedStudents.map(s => s.studentId);
    }

    // Build where clause
    const whereClause: any = {
      status: 'ACTIVE',
      branchId: parseInt(branchId),
      ...(assignedStudentIds.length > 0 ? {
        id: {
          notIn: assignedStudentIds
        }
      } : {})
    };

    // Add class filter if provided
    if (classIds) {
      const classIdArray = classIds.split(',').map(id => parseInt(id.trim()));
      whereClause.classId = {
        in: classIdArray
      };
    }

    // Get students
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        status: true,
        class: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { class: { name: 'asc' } },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error fetching available students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available students' },
      { status: 500 }
    );
  }
}));

