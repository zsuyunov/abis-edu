import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET /api/teacher-elective-students - Get students from elective groups for a teacher
export const GET = authenticateJWT(authorizeRole('TEACHER')(async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const electiveGroupId = searchParams.get('electiveGroupId');
    const electiveSubjectId = searchParams.get('electiveSubjectId');
    const subjectId = searchParams.get('subjectId');

    // Validate required parameters
    if (!electiveGroupId && !electiveSubjectId && !subjectId) {
      return NextResponse.json({ 
        error: "Either electiveGroupId, electiveSubjectId, or subjectId is required" 
      }, { status: 400 });
    }

    let whereClause: any = {};

    if (electiveSubjectId) {
      // Get students for a specific elective subject
      whereClause = {
        electiveSubjectId: parseInt(electiveSubjectId),
        status: 'ACTIVE'
      };
    } else if (electiveGroupId && subjectId) {
      // Get students for a specific subject within an elective group
      const electiveSubject = await prisma.electiveSubject.findFirst({
        where: {
          electiveGroupId: parseInt(electiveGroupId),
          subjectId: parseInt(subjectId),
          teacherIds: { has: teacherId },
          status: 'ACTIVE'
        }
      });

      if (!electiveSubject) {
        return NextResponse.json({ 
          error: "Elective subject not found or you don't have access" 
        }, { status: 404 });
      }

      whereClause = {
        electiveSubjectId: electiveSubject.id,
        status: 'ACTIVE'
      };
    } else if (electiveGroupId) {
      // Get all students in the elective group for subjects taught by this teacher
      const electiveSubjects = await prisma.electiveSubject.findMany({
        where: {
          electiveGroupId: parseInt(electiveGroupId),
          teacherIds: { has: teacherId },
          status: 'ACTIVE'
        }
      });

      if (electiveSubjects.length === 0) {
        return NextResponse.json({ 
          error: "No elective subjects found for this teacher in the group" 
        }, { status: 404 });
      }

      whereClause = {
        electiveSubjectId: { in: electiveSubjects.map(es => es.id) },
        status: 'ACTIVE'
      };
    }

    // Get student assignments
    const studentAssignments = await prisma.electiveStudentAssignment.findMany({
      where: whereClause,
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
        },
        electiveSubject: {
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            },
            electiveGroup: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          firstName: 'asc'
        }
      }
    });

    // Transform the data to match expected format
    const students = studentAssignments.map(assignment => ({
      id: assignment.student.id,
      studentId: assignment.student.studentId,
      firstName: assignment.student.firstName,
      lastName: assignment.student.lastName,
      fullName: `${assignment.student.firstName} ${assignment.student.lastName}`,
      originalClass: assignment.student.class?.name || 'Unknown Class',
      classId: assignment.student.class?.id,
      electiveSubject: assignment.electiveSubject.subject.name,
      electiveGroup: assignment.electiveSubject.electiveGroup.name,
      electiveSubjectId: assignment.electiveSubject.id,
      electiveGroupId: assignment.electiveSubject.electiveGroup.id
    }));

    // Group students by elective subject if multiple subjects are returned
    const groupedStudents = students.reduce((acc, student) => {
      const key = `${student.electiveGroupId}-${student.electiveSubjectId}`;
      if (!acc[key]) {
        acc[key] = {
          electiveGroupId: student.electiveGroupId,
          electiveGroupName: student.electiveGroup,
          electiveSubjectId: student.electiveSubjectId,
          electiveSubjectName: student.electiveSubject,
          students: []
        };
      }
      acc[key].students.push({
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: student.fullName,
        originalClass: student.originalClass,
        classId: student.classId
      });
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: Object.values(groupedStudents),
      totalStudents: students.length
    });

  } catch (error) {
    console.error('Error fetching elective students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective students' },
      { status: 500 }
    );
  }
}));
