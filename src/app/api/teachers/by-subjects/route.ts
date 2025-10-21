import { NextRequest, NextResponse } from 'next/server';
import prisma, { withPrismaRetry } from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
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

    const subjectIdArray = subjectIds.split(',').map(id => {
      const parsed = parseInt(id.trim());
      if (isNaN(parsed)) {
        throw new Error(`Invalid subject ID: ${id}`);
      }
      return parsed;
    });

    const classIdNum = parseInt(classId);
    const academicYearIdNum = parseInt(academicYearId);

    if (isNaN(classIdNum) || isNaN(academicYearIdNum)) {
      console.log('❌ Invalid classId or academicYearId');
      return NextResponse.json({ error: 'Invalid classId or academicYearId' }, { status: 400 });
    }

    console.log('🔍 Searching for teachers with subjects:', subjectIdArray, 'class:', classIdNum, 'year:', academicYearIdNum);

    // Find teachers assigned to the specified subjects for the given class and academic year
    const teacherAssignments = await withPrismaRetry(async () => {
      return prisma.teacherAssignment.findMany({
        where: {
          subjectId: {
            in: subjectIdArray
          },
          classId: classIdNum,
          academicYearId: academicYearIdNum,
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
    });

    console.log('📚 Found teacher assignments:', teacherAssignments.length);


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
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Invalid subject ID')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      // Database connection errors
      if (error.message.includes('Engine') || error.message.includes('Connection')) {
        console.error('Database connection error:', error.message);
        return NextResponse.json({ 
          error: 'Database connection error. Please try again.' 
        }, { status: 503 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}));
