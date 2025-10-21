import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// TEMPORARILY COMMENTED OUT - ELECTIVE ROUTES CAUSING ISSUES
/*
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId");

    // Get current academic year if not specified
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, status: "ACTIVE" },
      });
      targetAcademicYearId = currentYear?.id?.toString() || null;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year available" }, { status: 404 });
    }

    // Get teacher's assignments to determine which elective groups they can access
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: userId,
        academicYearId: parseInt(targetAcademicYearId),
        status: "ACTIVE",
      },
      include: {
        Branch: true,
        Class: true,
        Subject: true,
      },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ 
        electiveGroups: [],
        message: "No active teaching assignments found" 
      });
    }

    // Get unique branch IDs from teacher's assignments
    const branchIds = [...new Set(teacherAssignments.map(ta => ta.branchId))];

    // Fetch elective groups for the teacher's branches
    const electiveGroups = await prisma.electiveGroup.findMany({
      where: {
        branchId: { in: branchIds },
        academicYearId: parseInt(targetAcademicYearId),
        status: "ACTIVE",
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
            isCurrent: true,
          },
        },
        electiveSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
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
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            electiveSubjects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to include student counts per elective subject
    const transformedGroups = electiveGroups.map(group => ({
      ...group,
      electiveSubjects: group.electiveSubjects.map(subject => ({
        ...subject,
        studentCount: subject.studentAssignments.length,
        students: subject.studentAssignments.map(assignment => assignment.student),
      })),
      totalSubjects: group._count.electiveSubjects,
      totalStudents: group.electiveSubjects.reduce(
        (total, subject) => total + subject.studentAssignments.length,
        0
      ),
    }));

    return NextResponse.json({
      success: true,
      electiveGroups: transformedGroups,
      totalGroups: transformedGroups.length,
      academicYear: {
        id: parseInt(targetAcademicYearId),
        name: transformedGroups[0]?.academicYear?.name || 'Unknown',
      },
    });

  } catch (error) {
    console.error('Error fetching teacher elective groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elective groups' },
      { status: 500 }
    );
  }
}
*/

// Temporary placeholder endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: "Elective routes temporarily disabled for maintenance",
    electiveGroups: [],
    totalGroups: 0
  }, { status: 503 });
}