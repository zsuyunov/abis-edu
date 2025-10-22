import { NextRequest, NextResponse } from 'next/server';
import prisma, { withPrismaRetry } from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET - Get all subjects assigned to an elective group
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);

    const electiveSubjects = await withPrismaRetry(() =>
      prisma.electiveSubject.findMany({
      where: {
        electiveGroupId
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            studentAssignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }));

    // Fetch teacher details for each subject
    const subjectsWithTeachers = await Promise.all(
      electiveSubjects.map(async (electiveSubject) => {
        const teachers = await withPrismaRetry(() =>
          prisma.teacher.findMany({
          where: {
            id: {
              in: electiveSubject.teacherIds
            }
          },
          select: {
            id: true,
            teacherId: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        }));

        return {
          ...electiveSubject,
          teachers
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: subjectsWithTeachers
    });

  } catch (error) {
    console.error('Error fetching elective subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective subjects' },
      { status: 500 }
    );
  }
}));

// POST - Assign subjects to an elective group
export const POST = authenticateJWT(authorizeRole('ADMIN')(async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);
    const body = await request.json();
    const { subjectIds, maxStudents, description } = body;

    // Validation
    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one subject ID is required' },
        { status: 400 }
      );
    }

    // Check if elective group exists
    const electiveGroup = await withPrismaRetry(() =>
      prisma.electiveGroup.findUnique({
        where: { id: electiveGroupId }
      })
    );

    if (!electiveGroup) {
      return NextResponse.json(
        { error: 'Elective group not found' },
        { status: 404 }
      );
    }

    // Get teacher assignments for the subjects
    const teacherAssignments = await withPrismaRetry(() =>
      prisma.teacherAssignment.findMany({
      where: {
        subjectId: {
          in: subjectIds.map((id: string) => parseInt(id))
        },
        branchId: electiveGroup.branchId,
        academicYearId: electiveGroup.academicYearId,
        status: 'ACTIVE'
      },
      select: {
        subjectId: true,
        teacherId: true
      }
    }));

    // Group teachers by subject
    const teachersBySubject = teacherAssignments.reduce((acc, assignment) => {
      if (assignment.subjectId) {
        if (!acc[assignment.subjectId]) {
          acc[assignment.subjectId] = [];
        }
        if (!acc[assignment.subjectId].includes(assignment.teacherId)) {
          acc[assignment.subjectId].push(assignment.teacherId);
        }
      }
      return acc;
    }, {} as Record<number, string[]>);

    // Create elective subjects
    const createdSubjects = [];
    const errors = [];

    for (const subjectId of subjectIds) {
      try {
        const subjectIdInt = parseInt(subjectId);

        // Check if already assigned
        const existing = await withPrismaRetry(() =>
          prisma.electiveSubject.findUnique({
            where: {
              electiveGroupId_subjectId: {
                electiveGroupId,
                subjectId: subjectIdInt
              }
            }
          })
        );

        if (existing) {
          errors.push(`Subject ID ${subjectId} is already assigned to this elective group`);
          continue;
        }

        const teacherIds = teachersBySubject[subjectIdInt] || [];

        const electiveSubject = await withPrismaRetry(() =>
          prisma.electiveSubject.create({
          data: {
            electiveGroupId,
            subjectId: subjectIdInt,
            teacherIds,
            maxStudents: maxStudents ? parseInt(maxStudents) : null,
            description: description || null,
            status: 'ACTIVE'
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }));

        createdSubjects.push(electiveSubject);
      } catch (err) {
        errors.push(`Failed to assign subject ID ${subjectId}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdSubjects,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `${createdSubjects.length} subject(s) assigned successfully${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
    }, { status: 201 });

  } catch (error) {
    console.error('Error assigning subjects to elective group:', error);
    return NextResponse.json(
      { error: 'Failed to assign subjects' },
      { status: 500 }
    );
  }
}));

// DELETE - Remove a subject from an elective group
export const DELETE = authenticateJWT(authorizeRole('ADMIN')(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const electiveSubjectId = searchParams.get('electiveSubjectId');

    if (!electiveSubjectId) {
      return NextResponse.json(
        { error: 'Elective subject ID is required' },
        { status: 400 }
      );
    }

    // Check if there are student assignments
    const studentCount = await withPrismaRetry(() =>
      prisma.electiveStudentAssignment.count({
        where: {
          electiveSubjectId: parseInt(electiveSubjectId)
        }
      })
    );

    if (studentCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot remove subject with ${studentCount} student assignment(s). Please remove students first.` 
        },
        { status: 400 }
      );
    }

    // Delete elective subject
    await withPrismaRetry(() =>
      prisma.electiveSubject.delete({
        where: {
          id: parseInt(electiveSubjectId)
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Subject removed from elective group successfully'
    });

  } catch (error) {
    console.error('Error removing subject from elective group:', error);
    return NextResponse.json(
      { error: 'Failed to remove subject' },
      { status: 500 }
    );
  }
}));

