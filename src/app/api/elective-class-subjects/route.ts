import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

const prisma = new PrismaClient();

// GET - Fetch elective class subjects
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const electiveClassId = searchParams.get('electiveClassId');

    if (!electiveClassId) {
      return NextResponse.json(
        { error: 'Elective class ID is required' },
        { status: 400 }
      );
    }

    const electiveClassSubjects = await prisma.electiveClassSubject.findMany({
      where: {
        electiveClassId: parseInt(electiveClassId),
        status: 'ACTIVE',
      },
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: electiveClassSubjects,
    });
  } catch (error) {
    console.error('Error fetching elective class subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective class subjects' },
      { status: 500 }
    );
  }
}

// POST - Create new elective class subject
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      electiveClassId,
      subjectId,
      teacherIds,
      maxStudents,
      description,
    } = body;

    if (!electiveClassId || !subjectId) {
      return NextResponse.json(
        { error: 'Elective class ID and subject ID are required' },
        { status: 400 }
      );
    }

    // Check if subject already exists in this elective class
    const existingSubject = await prisma.electiveClassSubject.findFirst({
      where: {
        electiveClassId: parseInt(electiveClassId),
        subjectId: parseInt(subjectId),
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject already exists in this elective class' },
        { status: 409 }
      );
    }

    const electiveClassSubject = await prisma.electiveClassSubject.create({
      data: {
        electiveClassId: parseInt(electiveClassId),
        subjectId: parseInt(subjectId),
        teacherIds: teacherIds || [],
        maxStudents: maxStudents ? parseInt(maxStudents) : null,
        description,
      },
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
    });

    return NextResponse.json({
      success: true,
      data: electiveClassSubject,
    });
  } catch (error) {
    console.error('Error creating elective class subject:', error);
    return NextResponse.json(
      { error: 'Failed to create elective class subject' },
      { status: 500 }
    );
  }
}

// PUT - Update elective class subject
async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      teacherIds,
      maxStudents,
      description,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Elective class subject ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (teacherIds !== undefined) updateData.teacherIds = teacherIds;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents ? parseInt(maxStudents) : null;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const electiveClassSubject = await prisma.electiveClassSubject.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: electiveClassSubject,
    });
  } catch (error) {
    console.error('Error updating elective class subject:', error);
    return NextResponse.json(
      { error: 'Failed to update elective class subject' },
      { status: 500 }
    );
  }
}

// DELETE - Remove elective class subject
async function deleteHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Elective class subject ID is required' },
        { status: 400 }
      );
    }

    // Set status to INACTIVE instead of deleting
    await prisma.electiveClassSubject.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: 'INACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Elective class subject removed successfully',
    });
  } catch (error) {
    console.error('Error removing elective class subject:', error);
    return NextResponse.json(
      { error: 'Failed to remove elective class subject' },
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

export const DELETE = authenticateJWT(authorizeRole('ADMIN')(async function DELETE(request: NextRequest) {
  return deleteHandler(request);
}));
