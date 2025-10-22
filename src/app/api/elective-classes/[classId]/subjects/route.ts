import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import prisma, { withPrismaRetry } from '@/lib/prisma';

// POST - Assign subjects to elective class
export const POST = authenticateJWT(authorizeRole('ADMIN')(async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = parseInt(params.classId);
    const body = await request.json();
    const { subjectIds, maxStudents = 30 } = body;

    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return NextResponse.json(
        { error: 'Subject IDs are required and must be an array' },
        { status: 400 }
      );
    }

    // Verify elective class exists
    const electiveClass = await withPrismaRetry(() =>
      prisma.electiveClass.findUnique({
        where: { id: classId },
        include: {
          branch: true,
          academicYear: true,
          class: true
        }
      })
    );

    if (!electiveClass) {
      return NextResponse.json(
        { error: 'Elective class not found' },
        { status: 404 }
      );
    }

    // Get subjects and verify they exist
    const subjects = await withPrismaRetry(() =>
      prisma.subject.findMany({
        where: {
          id: { in: subjectIds }
        }
      })
    );

    if (subjects.length !== subjectIds.length) {
      return NextResponse.json(
        { error: 'One or more subjects not found' },
        { status: 400 }
      );
    }

    // Create elective class subjects
    const createdSubjects = [];
    for (const subjectId of subjectIds) {
      const electiveClassSubject = await withPrismaRetry(() =>
        prisma.electiveClassSubject.create({
          data: {
            electiveClassId: classId,
            subjectId: parseInt(subjectId),
            maxStudents: parseInt(maxStudents.toString()),
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
        })
      );
      createdSubjects.push(electiveClassSubject);
    }

    return NextResponse.json({
      success: true,
      data: createdSubjects,
      message: `${createdSubjects.length} subjects assigned to elective class`
    });

  } catch (error) {
    console.error('Error assigning subjects to elective class:', error);
    return NextResponse.json(
      { error: 'Failed to assign subjects to elective class' },
      { status: 500 }
    );
  }
}));
