import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET - Fetch a single elective group by ID
export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);

    const electiveGroup = await prisma.electiveGroup.findUnique({
      where: { id: electiveGroupId },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true
          }
        },
        electiveSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            },
            studentAssignments: {
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
            }
          }
        }
      }
    });

    if (!electiveGroup) {
      return NextResponse.json(
        { error: 'Elective group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: electiveGroup
    });

  } catch (error) {
    console.error('Error fetching elective group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective group' },
      { status: 500 }
    );
  }
}));

// PUT - Update an elective group
export const PUT = authenticateJWT(authorizeRole('ADMIN')(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);
    const body = await request.json();
    const { name, description, status } = body;

    // Check if elective group exists
    const existingGroup = await prisma.electiveGroup.findUnique({
      where: { id: electiveGroupId }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Elective group not found' },
        { status: 404 }
      );
    }

    // If name is being updated, check for uniqueness
    if (name && name !== existingGroup.name) {
      const duplicateGroup = await prisma.electiveGroup.findUnique({
        where: {
          name_branchId_academicYearId: {
            name,
            branchId: existingGroup.branchId,
            academicYearId: existingGroup.academicYearId
          }
        }
      });

      if (duplicateGroup) {
        return NextResponse.json(
          { error: 'An elective group with this name already exists for this branch and academic year' },
          { status: 409 }
        );
      }
    }

    // Update elective group
    const updatedGroup = await prisma.electiveGroup.update({
      where: { id: electiveGroupId },
      data: {
        name: name || existingGroup.name,
        description: description !== undefined ? description : existingGroup.description,
        status: status || existingGroup.status,
        updatedAt: new Date()
      },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedGroup,
      message: 'Elective group updated successfully'
    });

  } catch (error) {
    console.error('Error updating elective group:', error);
    return NextResponse.json(
      { error: 'Failed to update elective group' },
      { status: 500 }
    );
  }
}));

// DELETE - Delete an elective group (hard delete)
export const DELETE = authenticateJWT(authorizeRole('ADMIN')(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electiveGroupId = parseInt(params.id);

    // Check if elective group exists
    const existingGroup = await prisma.electiveGroup.findUnique({
      where: { id: electiveGroupId },
      include: {
        _count: {
          select: {
            electiveSubjects: true
          }
        }
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Elective group not found' },
        { status: 404 }
      );
    }

    // Check if there are subjects assigned (optional safety check)
    if (existingGroup._count.electiveSubjects > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete elective group with assigned subjects. Please remove all subjects first or use archive instead.' 
        },
        { status: 400 }
      );
    }

    // Delete elective group (cascade will handle related records)
    await prisma.electiveGroup.delete({
      where: { id: electiveGroupId }
    });

    return NextResponse.json({
      success: true,
      message: 'Elective group deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting elective group:', error);
    return NextResponse.json(
      { error: 'Failed to delete elective group' },
      { status: 500 }
    );
  }
}));

