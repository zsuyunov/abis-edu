import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
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
    let whereClause: any = {};

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

    // Fetch attendance records with related data
    const attendanceRecords = await prisma.attendance.findMany({
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
        }
      },
      orderBy: [
        { date: 'desc' },
        { student: { firstName: 'asc' } }
      ]
    });

    // Transform data for frontend
    const transformedAttendance = attendanceRecords.map(record => ({
      id: record.id.toString(),
      status: record.status,
      subject: {
        id: record.subject.id.toString(),
        name: record.subject.name
      },
      student: {
        id: record.student.id,
        firstName: record.student.firstName,
        lastName: record.student.lastName,
        studentId: record.student.studentId
      },
      teacher: {
        id: record.teacher.id,
        firstName: record.teacher.firstName,
        lastName: record.teacher.lastName
      },
      date: record.date.toISOString(),
      note: (record as any).notes || ''
    }));

    return NextResponse.json({
      success: true,
      data: {
        attendance: transformedAttendance,
        totalCount: transformedAttendance.length
      }
    });

  } catch (error) {
    console.error('Error fetching admin attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}))
