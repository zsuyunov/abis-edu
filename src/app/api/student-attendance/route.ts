import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const studentId = request.headers.get('x-user-id');
    let authenticatedUserId = studentId;

    if (!studentId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = await AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const url = new URL(request.url);
    const requestedStudentId = url.searchParams.get("studentId") || authenticatedUserId;
    
    if (!requestedStudentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }
    const period = url.searchParams.get("period") || "7days"; // 7days, 4weeks, 12weeks, year
    const month = url.searchParams.get("month"); // e.g., "2025-10"
    const subjectId = url.searchParams.get("subjectId");
    const academicYearIdRaw = url.searchParams.get("academicYearId");
    const academicYearId: string | undefined = academicYearIdRaw === null ? undefined : academicYearIdRaw;
    const view = url.searchParams.get("view") || "stats"; // stats, calendar, analytics

    // Verify student can only access their own attendance data
    if (authenticatedUserId !== requestedStudentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: requestedStudentId || undefined },
      include: {
        class: {
          include: {
            branch: true,
          },
        },
        branch: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Calculate date range based on period or month
    const dateRange = month ? calculateMonthRange(month) : calculateDateRange(period);

    // Build filter conditions
    const attendanceWhere: any = {
      studentId: requestedStudentId,
      date: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    };

    // Filter by subjectId directly (Attendance has direct subjectId field)
    if (subjectId) {
      attendanceWhere.subjectId = parseInt(subjectId);
    }

    // Filter by academicYearId directly (Attendance has direct academicYearId field)
    if (academicYearId) {
      attendanceWhere.academicYearId = parseInt(academicYearId);
    }

    // Debug: Log query parameters
    console.log('🔍 Attendance Query:', {
      studentId: requestedStudentId,
      month,
      period,
      dateRange,
      subjectId,
      whereClause: attendanceWhere
    });

    // Get attendance records with subject information
    const attendanceRecords = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        subject: true, // Direct relation from Attendance to Subject
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log(`✅ Found ${attendanceRecords.length} attendance records`);
    
    // If no records found, try to get total count for this student
    if (attendanceRecords.length === 0) {
      const totalCount = await prisma.attendance.count({
        where: { studentId: requestedStudentId }
      });
      console.log(`📊 Total attendance records for student: ${totalCount}`);
      
      if (totalCount > 0) {
        // Get a sample record to see the dates
        const sampleRecords = await prisma.attendance.findMany({
          where: { studentId: requestedStudentId },
          take: 5,
          orderBy: { date: 'desc' },
          select: { date: true, status: true }
        });
        console.log('📅 Sample attendance dates:', sampleRecords);
      }
    }

    // Calculate statistics
    const stats = calculateAttendanceStats(attendanceRecords, period);

    if (view === "calendar") {
      // @ts-ignore: TypeScript strict null check issue with URL search params
      return getAttendanceCalendar(requestedStudentId!, dateRange, subjectId, academicYearId);
    }

    if (view === "analytics") {
      return getAttendanceAnalytics(attendanceRecords, student, period);
    }

    // Format data for analytics components
    const barData = generateBarChartData(attendanceRecords, period);
    
    // Format attendance records with subject information
    const formattedAttendanceRecords = attendanceRecords.map(record => ({
      id: record.id.toString(),
      date: record.date.toISOString(),
      status: record.status,
      notes: record.notes,
      subject: {
        id: record.subject?.id?.toString() || record.subjectId?.toString() || '',
        name: record.subject?.name || 'Unknown Subject'
      },
      timetable: {
        startTime: '00:00',
        endTime: '00:00'
      }
    }));
    
    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class,
        branch: student.branch,
      },
      data: {
        attendanceRecords: formattedAttendanceRecords
      },
      attendanceRecords: formattedAttendanceRecords, // Backward compatibility
      attendance: attendanceRecords,
      stats: {
        present: stats.presentCount,
        absent: stats.absentCount,
        late: stats.lateCount,
        excused: stats.excusedCount,
        total: stats.totalRecords,
        percentage: stats.attendanceRate
      },
      barData,
      period,
      month,
      dateRange: {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString()
      },
      subjects: student.class?.branch ? [] : [],
      debug: {
        recordCount: attendanceRecords.length,
        formattedCount: formattedAttendanceRecords.length,
        queryParams: { month, period, subjectId, academicYearId }
      }
    });

  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateDateRange(period: string) {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (period) {
    case "7days":
      startDate.setDate(now.getDate() - 7);
      break;
    case "4weeks":
      startDate.setDate(now.getDate() - 28);
      break;
    case "12weeks":
      startDate.setDate(now.getDate() - 84);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  return { startDate, endDate };
}

function calculateMonthRange(month: string) {
  // Month format: "2025-10"
  const [year, monthNum] = month.split('-').map(Number);
  // Start of month at 00:00:00
  const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
  // End of month at 23:59:59.999
  const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
  
  console.log(`📅 Month range for ${month}:`, {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    startLocal: startDate.toString(),
    endLocal: endDate.toString()
  });
  
  return { startDate, endDate };
}

function calculateAttendanceStats(records: any[], period: string) {
  const totalRecords = records.length;
  const presentCount = records.filter(r => r.status === "PRESENT").length;
  const absentCount = records.filter(r => r.status === "ABSENT").length;
  const lateCount = records.filter(r => r.status === "LATE").length;
  const excusedCount = records.filter(r => r.status === "EXCUSED").length;

  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
  const punctualityRate = totalRecords > 0 ? Math.round(((presentCount + excusedCount) / totalRecords) * 100) : 0;

  // Group by date for chart data
  const dailyStats: Record<string, any> = {};
  records.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = {
        date: dateKey,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
    }
    dailyStats[dateKey][record.status.toLowerCase()]++;
    dailyStats[dateKey].total++;
  });

  const chartData = Object.values(dailyStats).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  );

  // Subject-wise breakdown - temporarily disabled due to schema changes
  // const subjectStats: Record<string, any> = {};
  // records.forEach(record => {
  //   const subjectName = record.timetable.subject.name;
  //   if (!subjectStats[subjectName]) {
  //     subjectStats[subjectName] = {
  //       subject: subjectName,
  //       present: 0,
  //       absent: 0,
  //       late: 0,
  //       excused: 0,
  //       total: 0,
  //     };
  //   }
  //   subjectStats[subjectName][record.status.toLowerCase()]++;
  //   subjectStats[subjectName].total++;
  // });

  return {
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
    punctualityRate,
    chartData,
    subjectStats: [], // temporarily empty due to schema changes
    period,
  };
}

async function getAttendanceCalendar(studentId: string, dateRange: any, subjectId?: string, academicYearId?: string) {
  const attendanceWhere: any = {
    studentId,
    date: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };

  // Filter by subjectId directly (Attendance has direct subjectId field)
  if (subjectId) {
    attendanceWhere.subjectId = parseInt(subjectId);
  }

  // Filter by academicYearId directly (Attendance has direct academicYearId field)
  if (academicYearId) {
    attendanceWhere.academicYearId = parseInt(academicYearId);
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: attendanceWhere,
    orderBy: {
      date: 'desc',
    },
  });

  // Group by date for calendar view
  const calendarData: Record<string, any[]> = {};
  attendanceRecords.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0];
    if (!calendarData[dateKey]) {
      calendarData[dateKey] = [];
    }
    calendarData[dateKey].push(record);
  });

  return NextResponse.json({
    calendarData,
    dateRange,
    totalRecords: attendanceRecords.length,
  });
}

async function getAttendanceAnalytics(records: any[], student: any, period: string) {
  const analytics = {
    trends: calculateAttendanceTrends(records),
    patterns: calculateAttendancePatterns(records),
    insights: generateAttendanceInsights(records, period),
    recommendations: generateRecommendations(records),
  };

  return NextResponse.json({
    student,
    analytics,
    period,
  });
}

function calculateAttendanceTrends(records: any[]) {
  // Weekly trends
  const weeklyTrends: Record<string, any> = {};
  records.forEach(record => {
    const weekStart = getWeekStart(record.date);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyTrends[weekKey]) {
      weeklyTrends[weekKey] = {
        week: weekKey,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
    }
    
    weeklyTrends[weekKey][record.status.toLowerCase()]++;
    weeklyTrends[weekKey].total++;
  });

  return Object.values(weeklyTrends).sort((a: any, b: any) => 
    a.week.localeCompare(b.week)
  );
}

function calculateAttendancePatterns(records: any[]) {
  // Day of week patterns
  const dayPatterns: Record<string, any> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  records.forEach(record => {
    const dayOfWeek = record.date.getDay();
    const dayName = dayNames[dayOfWeek];
    
    if (!dayPatterns[dayName]) {
      dayPatterns[dayName] = {
        day: dayName,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
    }
    
    dayPatterns[dayName][record.status.toLowerCase()]++;
    dayPatterns[dayName].total++;
  });

  return Object.values(dayPatterns);
}

function generateAttendanceInsights(records: any[], period: string) {
  const insights: string[] = [];
  const stats = calculateAttendanceStats(records, period);

  if (stats.attendanceRate >= 95) {
    insights.push("🌟 Excellent attendance! You're consistently present in class.");
  } else if (stats.attendanceRate >= 85) {
    insights.push("👍 Good attendance rate. Keep up the consistent effort!");
  } else if (stats.attendanceRate >= 75) {
    insights.push("📈 Your attendance could improve. Try to be more consistent.");
  } else {
    insights.push("⚠️ Low attendance rate. Consider speaking with your teacher about any challenges.");
  }

  if (stats.lateCount > stats.totalRecords * 0.1) {
    insights.push("⏰ You have several late arrivals. Try to arrive on time to not miss important content.");
  }

  if (stats.punctualityRate >= 90) {
    insights.push("⏰ Great punctuality! You're rarely late or absent.");
  }

  return insights;
}

function generateRecommendations(records: any[]) {
  const recommendations: string[] = [];
  const stats = calculateAttendanceStats(records, "");

  if (stats.attendanceRate < 85) {
    recommendations.push("Set a daily routine to ensure consistent attendance");
    recommendations.push("Speak with your teacher if you're facing challenges");
  }

  if (stats.lateCount > 3) {
    recommendations.push("Leave home 10-15 minutes earlier to avoid being late");
    recommendations.push("Prepare your school materials the night before");
  }

  if (stats.attendanceRate >= 95) {
    recommendations.push("Maintain your excellent attendance record");
    recommendations.push("Help classmates who might be struggling with attendance");
  }

  return recommendations;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function generateBarChartData(records: any[], period: string) {
  const barData = [];
  
  if (period === "7days") {
    // Generate data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = records.filter(r => r.date.toISOString().split('T')[0] === dateStr);
      const total = dayRecords.length;
      const present = dayRecords.filter(r => r.status === "PRESENT").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      barData.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        percentage,
        date: dateStr
      });
    }
  } else if (period === "4weeks") {
    // Generate data for last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      const total = weekRecords.length;
      const present = weekRecords.filter(r => r.status === "PRESENT").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      barData.push({
        label: `${startDate.getDate()}/${startDate.getMonth() + 1}`,
        percentage,
        date: startDate.toISOString().split('T')[0]
      });
    }
  } else if (period === "12weeks") {
    // Generate data for last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      const total = weekRecords.length;
      const present = weekRecords.filter(r => r.status === "PRESENT").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      barData.push({
        label: `${startDate.getDate() < 10 ? '0' : ''}${startDate.getDate()}`,
        percentage,
        date: startDate.toISOString().split('T')[0]
      });
    }
  } else if (period === "year") {
    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      const total = monthRecords.length;
      const present = monthRecords.filter(r => r.status === "PRESENT").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      barData.push({
        label: `${date.getMonth() + 1 < 10 ? '0' : ''}${date.getMonth() + 1}`,
        percentage,
        date: monthStart.toISOString().split('T')[0]
      });
    }
  }
  
  return barData;
}