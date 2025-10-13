import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const month = searchParams.get('month');
    const academicYearId = searchParams.get('academicYearId');
    const branchId = searchParams.get('branchId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    let whereClause: any = {
      // Only show daily grades, exclude exam types
      type: {
        notIn: ['EXAM_MIDTERM', 'EXAM_FINAL', 'EXAM_NATIONAL']
      }
    };

    if (classId) {
      whereClause.classId = parseInt(classId);
    }
    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    }
    if (academicYearId) {
      whereClause.academicYearId = parseInt(academicYearId);
    }
    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }

    // Handle date filtering
    if (month) {
      // Create date range for the month
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of the month
      
      whereClause.date = {
        gte: monthStart,
        lte: monthEnd
      };
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch grades with related data
    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        timetable: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { student: { firstName: 'asc' } }
      ]
    });

    // Transform data for frontend
    const transformedGrades = grades.map(grade => ({
      id: grade.id.toString(),
      value: grade.value,
      type: grade.type,
      subject: {
        id: grade.subject.id.toString(),
        name: grade.subject.name
      },
      student: {
        id: grade.student.id,
        firstName: grade.student.firstName,
        lastName: grade.student.lastName,
        studentId: grade.student.studentId
      },
      teacher: {
        id: grade.teacher.id,
        firstName: grade.teacher.firstName,
        lastName: grade.teacher.lastName
      },
      date: grade.date.toISOString(),
      comment: grade.description,
      timetable: grade.timetable ? {
        id: grade.timetable.id,
        startTime: grade.timetable.startTime,
        endTime: grade.timetable.endTime,
        subject: grade.timetable.subject
      } : undefined
    }));

    return NextResponse.json({
      success: true,
      data: {
        grades: transformedGrades,
        totalCount: transformedGrades.length
      }
    });

  } catch (error) {
    console.error('Error fetching admin grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
