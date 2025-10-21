import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

const prisma = new PrismaClient();

// GET - Fetch students by class
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const status = searchParams.get('status') || 'ACTIVE';
    const excludeElectiveClassSubjectId = searchParams.get('excludeElectiveClassSubjectId');

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      classId: parseInt(classId),
      status: status as any,
    };

    // If we need to exclude students already assigned to a specific elective class subject
    if (excludeElectiveClassSubjectId) {
      const assignedStudentIds = await prisma.electiveClassStudentAssignment.findMany({
        where: {
          electiveClassSubjectId: parseInt(excludeElectiveClassSubjectId),
          status: 'ACTIVE',
        },
        select: {
          studentId: true,
        },
      });

      const assignedIds = assignedStudentIds.map(a => a.studentId);
      if (assignedIds.length > 0) {
        whereClause.id = {
          notIn: assignedIds,
        };
      }
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
          },
        },
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  return getHandler(request);
}));
