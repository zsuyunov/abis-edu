import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, format, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval } from 'date-fns';

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface AttendanceStats {
  totalStudents: number;
  presentRate: number;
  absentRate: number;
  lateRate: number;
  excusedRate: number;
  weeklyData: AttendanceData[];
  monthlyTrend: {
    month: string;
    attendance: number;
  }[];
}

export const GET = authenticateJWT(authorizeRole('ADMIN')(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week'; // week, month, year
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    // Determine date range based on parameter
    switch (range) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }

    // Fetch all attendance records within the date range from all branches
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        archived: false
      },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true
          }
        }
      }
    });

    // Get total active students across all branches
    const totalStudents = await prisma.student.count({
      where: {
        status: 'ACTIVE',
        archivedAt: null
      }
    });

    // Calculate overall statistics
    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
    const excusedCount = attendanceRecords.filter(r => r.status === 'EXCUSED').length;
    const totalRecords = attendanceRecords.length;

    const presentRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
    const absentRate = totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0;
    const lateRate = totalRecords > 0 ? (lateCount / totalRecords) * 100 : 0;
    const excusedRate = totalRecords > 0 ? (excusedCount / totalRecords) * 100 : 0;

    // Generate time-series data
    let weeklyData: AttendanceData[] = [];
    let monthlyTrend: { month: string; attendance: number }[] = [];

    if (range === 'week') {
      // Generate daily data for the week
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      weeklyData = daysInRange.map(day => {
        const dayRecords = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.toDateString() === day.toDateString();
        });

        const present = dayRecords.filter(r => r.status === 'PRESENT').length;
        const absent = dayRecords.filter(r => r.status === 'ABSENT').length;
        const late = dayRecords.filter(r => r.status === 'LATE').length;
        const excused = dayRecords.filter(r => r.status === 'EXCUSED').length;

        return {
          date: format(day, 'EEE'), // Mon, Tue, Wed, etc.
          present,
          absent,
          late,
          excused,
          total: dayRecords.length
        };
      });
    } else if (range === 'month') {
      // Generate weekly data for the month
      const weeksInRange = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );
      
      weeklyData = weeksInRange.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekRecords = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        });

        const present = weekRecords.filter(r => r.status === 'PRESENT').length;
        const absent = weekRecords.filter(r => r.status === 'ABSENT').length;
        const late = weekRecords.filter(r => r.status === 'LATE').length;
        const excused = weekRecords.filter(r => r.status === 'EXCUSED').length;

        return {
          date: `Week ${index + 1}`,
          present,
          absent,
          late,
          excused,
          total: weekRecords.length
        };
      });
    } else if (range === 'year') {
      // Generate monthly data for the year
      const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });
      
      weeklyData = monthsInRange.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthRecords = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        const present = monthRecords.filter(r => r.status === 'PRESENT').length;
        const absent = monthRecords.filter(r => r.status === 'ABSENT').length;
        const late = monthRecords.filter(r => r.status === 'LATE').length;
        const excused = monthRecords.filter(r => r.status === 'EXCUSED').length;

        return {
          date: format(monthStart, 'MMM'), // Jan, Feb, Mar, etc.
          present,
          absent,
          late,
          excused,
          total: monthRecords.length
        };
      });

      // Monthly trend (attendance rate)
      monthlyTrend = monthsInRange.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthRecords = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        const presentInMonth = monthRecords.filter(r => r.status === 'PRESENT').length;
        const attendanceRate = monthRecords.length > 0 
          ? (presentInMonth / monthRecords.length) * 100 
          : 0;

        return {
          month: format(monthStart, 'MMM'),
          attendance: Math.round(attendanceRate * 10) / 10
        };
      });
    }

    const response: AttendanceStats = {
      totalStudents,
      presentRate: Math.round(presentRate * 10) / 10,
      absentRate: Math.round(absentRate * 10) / 10,
      lateRate: Math.round(lateRate * 10) / 10,
      excusedRate: Math.round(excusedRate * 10) / 10,
      weeklyData,
      monthlyTrend
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance analytics' },
      { status: 500 }
    );
  }
}));

