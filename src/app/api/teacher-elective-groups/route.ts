import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

// GET /api/teacher-elective-groups - Get elective groups where teacher has assigned subjects
export const GET = authenticateJWT(authorizeRole('TEACHER')(async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');

    // Get teacher's elective subject assignments
    const electiveSubjects = await prisma.electiveSubject.findMany({
      where: {
        teacherIds: { has: teacherId },
        status: 'ACTIVE',
        electiveGroup: {
          status: 'ACTIVE',
          ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
          ...(branchId && { branchId: parseInt(branchId) })
        }
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        electiveGroup: {
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
        },
        studentAssignments: {
          where: {
            status: 'ACTIVE'
          },
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
      },
      orderBy: {
        electiveGroup: {
          name: 'asc'
        }
      }
    });

    // Group by elective group
    const groupedData = electiveSubjects.reduce((acc, electiveSubject) => {
      const groupId = electiveSubject.electiveGroup.id;
      
      if (!acc[groupId]) {
        acc[groupId] = {
          id: electiveSubject.electiveGroup.id,
          name: electiveSubject.electiveGroup.name,
          description: electiveSubject.electiveGroup.description,
          branch: electiveSubject.electiveGroup.branch,
          academicYear: electiveSubject.electiveGroup.academicYear,
          subjects: [],
          totalStudents: 0,
          uniqueStudentIds: new Set()
        };
      }

      // Add subject info
      acc[groupId].subjects.push({
        id: electiveSubject.id,
        subjectId: electiveSubject.subject.id,
        subjectName: electiveSubject.subject.name,
        maxStudents: electiveSubject.maxStudents,
        description: electiveSubject.description,
        studentCount: electiveSubject.studentAssignments.length,
        students: electiveSubject.studentAssignments.map(assignment => ({
          id: assignment.student.id,
          studentId: assignment.student.studentId,
          firstName: assignment.student.firstName,
          lastName: assignment.student.lastName,
          fullName: `${assignment.student.firstName} ${assignment.student.lastName}`,
          originalClass: assignment.student.class?.name || 'Unknown Class',
          classId: assignment.student.class?.id
        }))
      });

      // Count unique students across all subjects in the group
      electiveSubject.studentAssignments.forEach(assignment => {
        acc[groupId].uniqueStudentIds.add(assignment.student.id);
      });

      return acc;
    }, {} as Record<number, any>);

    // Convert to array and calculate final student counts
    const electiveGroups = Object.values(groupedData).map(group => ({
      ...group,
      totalStudents: group.uniqueStudentIds.size,
      uniqueStudentIds: undefined // Remove the Set from response
    }));

    return NextResponse.json({
      success: true,
      data: electiveGroups,
      totalGroups: electiveGroups.length
    });

  } catch (error) {
    console.error('Error fetching teacher elective groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective groups' },
      { status: 500 }
    );
  }
}));
