import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch student elective selections
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const timetableId = searchParams.get('timetableId');
    const classId = searchParams.get('classId');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (timetableId) where.timetableId = parseInt(timetableId);
    if (classId) {
      where.timetable = {
        classId: parseInt(classId)
      };
    }

    const selections = await prisma.studentElectiveSelection.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        timetable: {
          include: {
            class: true,
            subject: true
          }
        },
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teacherId: true
          }
        }
      }
    });

    return NextResponse.json(selections);
  } catch (error) {
    console.error('Error fetching student elective selections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update student elective selection
export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, timetableId, subjectId, teacherId } = body;

    // Validate required fields
    if (!studentId || !timetableId || !subjectId || !teacherId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify timetable is elective
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId }
    });
    
    if (!timetable || !(timetable as any).isElective) {
      return NextResponse.json({ error: 'Timetable is not elective' }, { status: 400 });
    }

    // Check if student already has a selection for this timetable
    const existingSelection = await prisma.studentElectiveSelection.findFirst({
      where: {
        studentId,
        timetableId: parseInt(timetableId)
      }
    });

    if (existingSelection) {
      // Update existing selection
      const updatedSelection = await prisma.studentElectiveSelection.update({
        where: { id: existingSelection.id },
        data: {
          subjectId: parseInt(subjectId),
          teacherId
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true
            }
          },
          timetable: true,
          subject: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              teacherId: true
            }
          }
        }
      });

      return NextResponse.json(updatedSelection);
    } else {
      // Create new selection
      const selection = await prisma.studentElectiveSelection.create({
        data: {
          studentId,
          timetableId: parseInt(timetableId),
          subjectId: parseInt(subjectId),
          teacherId
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true
            }
          },
          timetable: true,
          subject: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              teacherId: true
            }
          }
        }
      });

      return NextResponse.json(selection, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating student elective selection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove student elective selection
export async function DELETE(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const timetableId = searchParams.get('timetableId');

    if (!studentId || !timetableId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    await prisma.studentElectiveSelection.deleteMany({
      where: {
        studentId,
        timetableId: parseInt(timetableId)
      }
    });

    return NextResponse.json({ message: 'Selection deleted successfully' });
  } catch (error) {
    console.error('Error deleting student elective selection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
