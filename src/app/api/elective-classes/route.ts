import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import prisma, { withPrismaRetry } from '@/lib/prisma';


// GET - Fetch elective classes
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status') || 'ACTIVE';

    if (!branchId || !academicYearId) {
      return NextResponse.json(
        { error: 'Branch ID and Academic Year ID are required' },
        { status: 400 }
      );
    }

    const electiveClasses = await withPrismaRetry(() =>
      prisma.electiveClass.findMany({
      where: {
        branchId: parseInt(branchId),
        academicYearId: parseInt(academicYearId),
        status: status as any,
      },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
            studentAssignments: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    studentId: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }));

    return NextResponse.json({
      success: true,
      data: electiveClasses,
    });
  } catch (error) {
    console.error('Error fetching elective classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective classes' },
      { status: 500 }
    );
  }
}

// POST - Create new elective class
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      branchId,
      academicYearId,
      classId,
      createdBy,
    } = body;

    if (!name || !branchId || !academicYearId || !classId || !createdBy) {
      return NextResponse.json(
        { error: 'Name, branch ID, academic year ID, class ID, and created by are required' },
        { status: 400 }
      );
    }

    // Check if any elective class already exists for this class (only one elective class per actual class allowed)
    const existingElectiveClassForClass = await withPrismaRetry(() =>
      prisma.electiveClass.findFirst({
        where: {
          classId: parseInt(classId),
          academicYearId: parseInt(academicYearId),
          status: {
            in: ['ACTIVE', 'INACTIVE']
          }
        },
        include: {
          branch: {
            select: {
              shortName: true
            }
          }
        }
      })
    );

    if (existingElectiveClassForClass) {
      return NextResponse.json(
        {
          error: `An elective class already exists for this class in ${existingElectiveClassForClass.branch.shortName}. Only one elective class is allowed per actual class.`
        },
        { status: 409 }
      );
    }

    // Check if elective class with same name already exists for this branch, academic year, and class
    const existingElectiveClass = await withPrismaRetry(() =>
      prisma.electiveClass.findFirst({
      where: {
        name,
        branchId: parseInt(branchId),
        academicYearId: parseInt(academicYearId),
        classId: parseInt(classId),
      },
    }));

    if (existingElectiveClass) {
      return NextResponse.json(
        { error: 'Elective class with this name already exists for this class' },
        { status: 409 }
      );
    }

    const electiveClass = await withPrismaRetry(() =>
      prisma.electiveClass.create({
      data: {
        name,
        description,
        branchId: parseInt(branchId),
        academicYearId: parseInt(academicYearId),
        classId: parseInt(classId),
        createdBy,
      },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }));

    return NextResponse.json({
      success: true,
      data: electiveClass,
    });
  } catch (error) {
    console.error('Error creating elective class:', error);
    return NextResponse.json(
      { error: 'Failed to create elective class' },
      { status: 500 }
    );
  }
}

// PUT - Update elective class
async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Elective class ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'ARCHIVED') {
        updateData.archivedAt = new Date();
      } else if (status === 'ACTIVE') {
        updateData.restoredAt = new Date();
        updateData.archivedAt = null;
      }
    }

    const electiveClass = await withPrismaRetry(() =>
      prisma.electiveClass.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }));

    return NextResponse.json({
      success: true,
      data: electiveClass,
    });
  } catch (error) {
    console.error('Error updating elective class:', error);
    return NextResponse.json(
      { error: 'Failed to update elective class' },
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

export const PUT = authenticateJWT(authorizeRole('ADMIN')(async function PUT(request: NextRequest) {
  return putHandler(request);
}));

