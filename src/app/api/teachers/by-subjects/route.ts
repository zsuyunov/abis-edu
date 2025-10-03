import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectIds = searchParams.get('subjectIds');
    const classId = searchParams.get('classId');
    const academicYearId = searchParams.get('academicYearId');

    console.log('🔍 API called with params:', { subjectIds, classId, academicYearId });

    if (!subjectIds || !classId || !academicYearId) {
      console.log('❌ Missing required parameters');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const subjectIdArray = subjectIds.split(',').map(id => parseInt(id.trim()));

    // First, let's check if there are any teacher assignments at all
    const allAssignments = await prisma.teacherAssignment.findMany({
      where: {
        classId: parseInt(classId),
        academicYearId: parseInt(academicYearId),
        status: 'ACTIVE'
      },
      take: 5
    });

    // Find teachers assigned to the specified subjects for the given class and academic year
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        subjectId: {
          in: subjectIdArray
        },
        classId: parseInt(classId),
        academicYearId: parseInt(academicYearId),
        status: 'ACTIVE'
      },
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teacherId: true,
            email: true
          }
        },
        Subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });


    // Group teachers by their ID to avoid duplicates
    const teacherMap = new Map();
    
    teacherAssignments.forEach(assignment => {
      const teacher = assignment.Teacher;
      if (!teacherMap.has(teacher.id)) {
        teacherMap.set(teacher.id, {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          teacherId: teacher.teacherId,
          email: teacher.email,
          subjects: []
        });
      }
      
      // Add subject information
      if (assignment.Subject) {
        teacherMap.get(teacher.id).subjects.push({
          id: assignment.Subject.id,
          name: assignment.Subject.name
        });
      }
    });

    const teachers = Array.from(teacherMap.values());
    console.log('✅ Returning teachers:', teachers.length);

    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers by subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
