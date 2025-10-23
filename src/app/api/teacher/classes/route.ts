import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 401 });
    }

    // Get teacher assignments with classes and subjects
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacherId,
        status: 'ACTIVE'
      },
      include: {
        Class: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
        Subject: {
          select: {
            id: true,
            name: true
          }
        },
        Branch: {
          select: {
            id: true,
            shortName: true
          }
        }
      }
    });

    // Group subjects by class
    const classesMap = new Map();
    
    teacherAssignments.forEach(assignment => {
      if (!assignment.Class || !assignment.Subject) return;
      
      const classId = assignment.Class.id;
      
      if (!classesMap.has(classId)) {
        classesMap.set(classId, {
          id: assignment.Class.id,
          name: assignment.Class.name,
          capacity: assignment.Class.capacity,
          branchName: assignment.Branch?.shortName || 'Unknown',
          subjects: []
        });
      }
      
      const classData = classesMap.get(classId);
      const existingSubject = classData.subjects.find((s: any) => s.id === assignment.Subject!.id);
      
      if (!existingSubject) {
        classData.subjects.push({
          id: assignment.Subject.id,
          name: assignment.Subject.name
        });
      }
    });

    const classes = Array.from(classesMap.values());

    return NextResponse.json({
      success: true,
      data: classes,
      totalClasses: classes.length
    });

  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher classes' },
      { status: 500 }
    );
  }
}
