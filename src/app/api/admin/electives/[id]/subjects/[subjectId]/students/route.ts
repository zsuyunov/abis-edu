import { NextRequest, NextResponse } from 'next/server';
import prisma, { withPrismaRetry } from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import { checkStudentSubjectConflict, getConflictErrorMessage } from '@/lib/elective-conflict-checker';

// GET - Get all students assigned to an elective subject
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(
  request: NextRequest,
  { params }: { params: { id: string; subjectId: string } }
) {
  try {
    const electiveSubjectId = parseInt(params.subjectId);

    const studentAssignments = await prisma.electiveStudentAssignment.findMany({
      where: {
        electiveSubjectId
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            status: true,
            class: {
              select: {
                id: true,
                name: true,
                branch: {
                  select: {
                    id: true,
                    shortName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: studentAssignments
    });

  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student assignments' },
      { status: 500 }
    );
  }
}));

// POST - Assign students to an elective subject
export const POST = authenticateJWT(authorizeRole('ADMIN')(async function POST(
  request: NextRequest,
  { params }: { params: { id: string; subjectId: string } },
  locals?: { user?: { id: string } }
) {
  try {
    const electiveSubjectId = parseInt(params.subjectId);
    const body = await request.json();
    const { studentIds } = body;

    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one student ID is required' },
        { status: 400 }
      );
    }

    // Get user ID for tracking
    const userId = locals?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check if elective subject exists and get max students limit
    const electiveSubject = await withPrismaRetry(() =>
      prisma.electiveSubject.findUnique({
        where: { id: electiveSubjectId },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          electiveGroup: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              studentAssignments: true
            }
          }
        }
      })
    );

    if (!electiveSubject) {
      return NextResponse.json(
        { error: 'Elective subject not found' },
        { status: 404 }
      );
    }

    // Check max students limit
    if (electiveSubject.maxStudents) {
      const currentStudents = electiveSubject._count.studentAssignments;
      const newTotal = currentStudents + studentIds.length;

      if (newTotal > electiveSubject.maxStudents) {
        return NextResponse.json(
          {
            error: `Cannot assign ${studentIds.length} student(s). Maximum capacity is ${electiveSubject.maxStudents}, currently ${currentStudents} assigned.`
          },
          { status: 400 }
        );
      }
    }

    // Check for conflicts with elective classes
    const conflictErrors = [];
    for (const studentId of studentIds) {
      const conflictResult = await checkStudentSubjectConflict(studentId, electiveSubject.subjectId);
      if (conflictResult.hasConflict) {
        const errorMessage = getConflictErrorMessage(conflictResult);
        conflictErrors.push(`Student ID ${studentId}: ${errorMessage}`);
      }
    }

    if (conflictErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Student assignment conflicts detected',
          details: conflictErrors
        },
        { status: 409 }
      );
    }

    // Create student assignments
    const createdAssignments = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        // Check if student exists and is active
        const student = await withPrismaRetry(() =>
          prisma.student.findUnique({
            where: { id: studentId },
            select: {
              id: true,
              status: true
            }
          })
        );

        if (!student) {
          errors.push(`Student ID ${studentId} not found`);
          continue;
        }

        if (student.status !== 'ACTIVE') {
          errors.push(`Student ID ${studentId} is not active`);
          continue;
        }

        // Check if already assigned
        const existing = await withPrismaRetry(() =>
          prisma.electiveStudentAssignment.findUnique({
            where: {
              electiveSubjectId_studentId: {
                electiveSubjectId,
                studentId
              }
            }
          })
        );

        if (existing) {
          errors.push(`Student ID ${studentId} is already assigned to this elective`);
          continue;
        }

        // Create assignment
        const assignment = await withPrismaRetry(() =>
          prisma.electiveStudentAssignment.create({
          data: {
            electiveSubjectId,
            studentId,
            assignedBy: userId,
            status: 'ACTIVE'
          },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
                class: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }));

        createdAssignments.push(assignment);
      } catch (err) {
        errors.push(`Failed to assign student ID ${studentId}`);
      }
    }

    // Update status to FULL if max capacity reached
    if (electiveSubject.maxStudents) {
      const newTotal = electiveSubject._count.studentAssignments + createdAssignments.length;
      if (newTotal >= electiveSubject.maxStudents) {
        await withPrismaRetry(() =>
          prisma.electiveSubject.update({
            where: { id: electiveSubjectId },
            data: { status: 'FULL' }
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdAssignments,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `${createdAssignments.length} student(s) assigned successfully${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
    }, { status: 201 });

  } catch (error) {
    console.error('Error assigning students to elective subject:', error);
    return NextResponse.json(
      { error: 'Failed to assign students' },
      { status: 500 }
    );
  }
}));

// DELETE - Remove a student from an elective subject
export const DELETE = authenticateJWT(authorizeRole('ADMIN')(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; subjectId: string } }
) {
  try {
    const electiveSubjectId = parseInt(params.subjectId);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Delete assignment
    const deleted = await withPrismaRetry(() =>
      prisma.electiveStudentAssignment.deleteMany({
        where: {
          electiveSubjectId,
          studentId
        }
      })
    );

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Student assignment not found' },
        { status: 404 }
      );
    }

    // Update status from FULL to ACTIVE if student was removed
    const electiveSubject = await withPrismaRetry(() =>
      prisma.electiveSubject.findUnique({
        where: { id: electiveSubjectId },
        include: {
          _count: {
            select: {
              studentAssignments: true
            }
          }
        }
      })
    );

    if (electiveSubject && electiveSubject.status === 'FULL' && electiveSubject.maxStudents) {
      if (electiveSubject._count.studentAssignments < electiveSubject.maxStudents) {
        await withPrismaRetry(() =>
          prisma.electiveSubject.update({
            where: { id: electiveSubjectId },
            data: { status: 'ACTIVE' }
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Student removed from elective successfully'
    });

  } catch (error) {
    console.error('Error removing student from elective:', error);
    return NextResponse.json(
      { error: 'Failed to remove student' },
      { status: 500 }
    );
  }
}));

