import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET - Get subjects available for assignment to an elective group
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const academicYearId = searchParams.get('academicYearId');
    const electiveGroupId = searchParams.get('electiveGroupId');

    if (!branchId || !academicYearId) {
      return NextResponse.json(
        { error: 'Branch ID and Academic Year ID are required' },
        { status: 400 }
      );
    }

    // Get already assigned subjects for this elective group
    let assignedSubjectIds: number[] = [];
    if (electiveGroupId) {
      const assignedSubjects = await prisma.electiveSubject.findMany({
        where: {
          electiveGroupId: parseInt(electiveGroupId)
        },
        select: {
          subjectId: true
        }
      });
      assignedSubjectIds = assignedSubjects.map(s => s.subjectId);
    }

    // Get all active subjects that have teacher assignments in this branch/academic year
    const subjects = await prisma.subject.findMany({
      where: {
        status: 'ACTIVE',
        ...(assignedSubjectIds.length > 0 ? {
          id: {
            notIn: assignedSubjectIds
          }
        } : {})
      },
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Error fetching available subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available subjects' },
      { status: 500 }
    );
  }
}));

