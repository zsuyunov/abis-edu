import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

const prisma = new PrismaClient();

// GET - Fetch elective class student assignments
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const electiveClassSubjectId = searchParams.get('electiveClassSubjectId');
    const studentId = searchParams.get('studentId');

    let whereClause: any = {
      status: 'ACTIVE',
    };

    if (electiveClassSubjectId) {
      whereClause.electiveClassSubjectId = parseInt(electiveClassSubjectId);
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    const assignments = await prisma.electiveClassStudentAssignment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        electiveClassSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
            electiveClass: {
              select: {
                id: true,
                name: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('Error fetching elective class student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective class student assignments' },
      { status: 500 }
    );
  }
}

// POST - Create new elective class student assignment
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      electiveClassSubjectId,
      studentIds,
      assignedBy,
    } = body;

    if (!electiveClassSubjectId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !assignedBy) {
      return NextResponse.json(
        { error: 'Elective class subject ID, student IDs array, and assigned by are required' },
        { status: 400 }
      );
    }

    // Get the elective class subject to validate class constraint
    const electiveClassSubject = await prisma.electiveClassSubject.findUnique({
      where: {
        id: parseInt(electiveClassSubjectId),
      },
      include: {
        electiveClass: {
          select: {
            classId: true,
          },
        },
      },
    });

    if (!electiveClassSubject) {
      return NextResponse.json(
        { error: 'Elective class subject not found' },
        { status: 404 }
      );
    }

    // Validate that all students belong to the same class as the elective class
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId: electiveClassSubject.electiveClass.classId,
        status: 'ACTIVE',
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Some students do not belong to the required class or are not active' },
        { status: 400 }
      );
    }

    // Check for existing assignments
    const existingAssignments = await prisma.electiveClassStudentAssignment.findMany({
      where: {
        electiveClassSubjectId: parseInt(electiveClassSubjectId),
        studentId: { in: studentIds },
      },
    });

    if (existingAssignments.length > 0) {
      const existingStudentIds = existingAssignments.map(a => a.studentId);
      return NextResponse.json(
        { error: `Some students are already assigned: ${existingStudentIds.join(', ')}` },
        { status: 409 }
      );
    }

    // Check max students limit
    if (electiveClassSubject.maxStudents) {
      const currentAssignments = await prisma.electiveClassStudentAssignment.count({
        where: {
          electiveClassSubjectId: parseInt(electiveClassSubjectId),
          status: 'ACTIVE',
        },
      });

      if (currentAssignments + studentIds.length > electiveClassSubject.maxStudents) {
        return NextResponse.json(
          { error: `Assignment would exceed maximum students limit (${electiveClassSubject.maxStudents})` },
          { status: 400 }
        );
      }
    }

    // Create assignments
    const assignments = await prisma.electiveClassStudentAssignment.createMany({
      data: studentIds.map((studentId: string) => ({
        electiveClassSubjectId: parseInt(electiveClassSubjectId),
        studentId,
        assignedBy,
      })),
    });

    // Fetch created assignments with includes
    const createdAssignments = await prisma.electiveClassStudentAssignment.findMany({
      where: {
        electiveClassSubjectId: parseInt(electiveClassSubjectId),
        studentId: { in: studentIds },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        electiveClassSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
            electiveClass: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: createdAssignments,
      message: `Successfully assigned ${assignments.count} students`,
    });
  } catch (error) {
    console.error('Error creating elective class student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to create elective class student assignments' },
      { status: 500 }
    );
  }
}

// DELETE - Remove elective class student assignment
async function deleteHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    const electiveClassSubjectId = searchParams.get('electiveClassSubjectId');

    if (id) {
      // Remove single assignment by ID
      await prisma.electiveClassStudentAssignment.update({
        where: {
          id: parseInt(id),
        },
        data: {
          status: 'WITHDRAWN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Student assignment removed successfully',
      });
    } else if (studentId && electiveClassSubjectId) {
      // Remove assignment by student and elective class subject
      await prisma.electiveClassStudentAssignment.updateMany({
        where: {
          studentId,
          electiveClassSubjectId: parseInt(electiveClassSubjectId),
          status: 'ACTIVE',
        },
        data: {
          status: 'WITHDRAWN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Student assignment removed successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Either assignment ID or both student ID and elective class subject ID are required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error removing elective class student assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove elective class student assignment' },
      { status: 500 }
    );
  }
}

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  return getHandler(request);
}));

export const POST = authenticateJWT(authorizeRole('ADMIN')(async function POST(request: NextRequest) {
  return postHandler(request);
}));

export const DELETE = authenticateJWT(authorizeRole('ADMIN')(async function DELETE(request: NextRequest) {
  return deleteHandler(request);
}));
