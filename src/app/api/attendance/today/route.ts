import { NextRequest, NextResponse } from 'next/server';
import prisma, { withPrismaRetry } from '@/lib/prisma';

// GET - Fetch today's attendance statistics
export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's attendance records
    const todayAttendance = await withPrismaRetry(() => 
      prisma.attendance.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true
            }
          }
        }
      })
    );

    // Calculate statistics
    const totalStudents = await withPrismaRetry(() => 
      prisma.student.count({
        where: {
          status: 'ACTIVE'
        }
      })
    );

    const presentCount = todayAttendance.filter(record => record.status === 'PRESENT').length;
    const absentCount = todayAttendance.filter(record => record.status === 'ABSENT').length;
    const lateCount = todayAttendance.filter(record => record.status === 'LATE').length;
    const excusedCount = todayAttendance.filter(record => record.status === 'EXCUSED').length;

    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      statistics: {
        totalStudents,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      records: todayAttendance
    });
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
