import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") || session.id;
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const timeFilter = url.searchParams.get("timeFilter") || "current"; // current, past
    const view = url.searchParams.get("view") || "overview"; // overview, analytics, export
    
    // Verify student can only access their own data
    if (session.id !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get student information with branch and class details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            academicYear: true,
            branch: true,
            subjects: true,
          },
        },
        branch: true,
        parent: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get student's branch for filtering
    const studentBranchId = student.branchId;

    // Get available academic years for the student (scoped by branch)
    let availableAcademicYears;
    if (timeFilter === "current") {
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { 
          isCurrent: true, 
          status: "ACTIVE",
          classes: {
            some: {
              students: {
                some: { 
                  id: studentId,
                  branchId: studentBranchId, // Ensure branch consistency
                },
              },
              branchId: studentBranchId, // Classes must be in student's branch
            },
          },
        },
        orderBy: { startDate: "desc" },
      });
    } else {
      availableAcademicYears = await prisma.academicYear.findMany({
        where: { 
          isCurrent: false,
          classes: {
            some: {
              students: {
                some: { 
                  id: studentId,
                  branchId: studentBranchId, // Ensure branch consistency
                },
              },
              branchId: studentBranchId, // Classes must be in student's branch
            },
          },
        },
        orderBy: { startDate: "desc" },
      });
    }

    // Determine which academic year to use
    let targetAcademicYearId;
    if (academicYearId) {
      targetAcademicYearId = parseInt(academicYearId);
    } else if (timeFilter === "current") {
      targetAcademicYearId = availableAcademicYears[0]?.id || student.class.academicYearId;
    } else {
      targetAcademicYearId = availableAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          class: student.class,
          branch: student.branch,
        },
        attendances: [],
        summary: {},
        availableAcademicYears,
        message: "No academic year data available"
      });
    }

    // Build filter conditions for attendance records with branch restriction
    const attendanceWhere: any = {
      studentId,
      branchId: studentBranchId, // Always filter by student's branch
      academicYearId: targetAcademicYearId,
    };

    if (subjectId) attendanceWhere.subjectId = parseInt(subjectId);

    if (startDate && endDate) {
      attendanceWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get attendance records with related data
    const attendances = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        timetable: {
          select: {
            id: true,
            fullDate: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { subject: { name: "asc" } },
      ],
    });

    // Get subjects for filter options (scoped by student's branch)
    const subjects = await prisma.subject.findMany({
      where: {
        classes: {
          some: {
            id: student.classId,
            branchId: studentBranchId, // Ensure subjects are from student's branch
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (view === "analytics") {
      return getStudentAttendanceAnalytics(attendances, student, {
        academicYearId: targetAcademicYearId,
        subjectId,
        startDate,
        endDate,
      });
    }

    // Calculate summary statistics
    const summary = calculateAttendanceSummary(attendances);
    
    // Calculate subject-wise statistics
    const subjectStats = calculateSubjectWiseStats(attendances);
    
    // Calculate attendance trends
    const trends = calculateAttendanceTrends(attendances);
    
    // Calculate motivational data
    const motivationalData = calculateMotivationalData(attendances, summary);

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class,
        branch: student.branch,
      },
      attendances,
      summary,
      subjectStats,
      trends,
      motivationalData,
      availableAcademicYears,
      subjects,
      timeFilter,
      view,
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
function calculateAttendanceSummary(attendances: any[]) {
  const totalRecords = attendances.length;
  const presentCount = attendances.filter(a => a.status === "PRESENT").length;
  const absentCount = attendances.filter(a => a.status === "ABSENT").length;
  const lateCount = attendances.filter(a => a.status === "LATE").length;
  const excusedCount = attendances.filter(a => a.status === "EXCUSED").length;

  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
  const absenteeismRate = totalRecords > 0 ? Math.round((absentCount / totalRecords) * 100) : 0;
  const lateRate = totalRecords > 0 ? Math.round((lateCount / totalRecords) * 100) : 0;

  return {
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
    absenteeismRate,
    lateRate,
  };
}

function calculateSubjectWiseStats(attendances: any[]) {
  const subjectStats: Record<string, any> = {};

  attendances.forEach(attendance => {
    const subjectId = attendance.subjectId;
    const subjectName = attendance.subject.name;
    
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        subject: {
          id: subjectId,
          name: subjectName,
        },
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      };
    }

    subjectStats[subjectId].totalRecords++;
    if (attendance.status === "PRESENT") subjectStats[subjectId].presentCount++;
    if (attendance.status === "ABSENT") subjectStats[subjectId].absentCount++;
    if (attendance.status === "LATE") subjectStats[subjectId].lateCount++;
    if (attendance.status === "EXCUSED") subjectStats[subjectId].excusedCount++;
  });

  // Calculate rates
  Object.values(subjectStats).forEach((stats: any) => {
    stats.attendanceRate = stats.totalRecords > 0 ? 
      Math.round((stats.presentCount / stats.totalRecords) * 100) : 0;
  });

  return Object.values(subjectStats).sort((a: any, b: any) => b.attendanceRate - a.attendanceRate);
}

function calculateAttendanceTrends(attendances: any[]) {
  const trends: Record<string, any> = {};

  attendances.forEach(attendance => {
    const dateKey = new Date(attendance.date).toISOString().split('T')[0];
    
    if (!trends[dateKey]) {
      trends[dateKey] = {
        date: dateKey,
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      };
    }

    trends[dateKey].totalRecords++;
    if (attendance.status === "PRESENT") trends[dateKey].presentCount++;
    if (attendance.status === "ABSENT") trends[dateKey].absentCount++;
    if (attendance.status === "LATE") trends[dateKey].lateCount++;
    if (attendance.status === "EXCUSED") trends[dateKey].excusedCount++;
  });

  // Calculate rates and sort by date
  return Object.values(trends)
    .map((trend: any) => ({
      ...trend,
      attendanceRate: trend.totalRecords > 0 ? 
        Math.round((trend.presentCount / trend.totalRecords) * 100) : 0,
    }))
    .sort((a: any, b: any) => a.date.localeCompare(b.date));
}

function calculateMotivationalData(attendances: any[], summary: any) {
  const badges: string[] = [];
  const alerts: string[] = [];
  const achievements: string[] = [];

  // Perfect Attendance Badge
  if (summary.totalRecords >= 10 && summary.attendanceRate === 100) {
    badges.push("Perfect Attendance");
    achievements.push(`🏆 Perfect Attendance! You've attended all ${summary.totalRecords} classes.`);
  }

  // Excellent Attendance Badge
  if (summary.attendanceRate >= 95 && summary.totalRecords >= 10) {
    badges.push("Excellent Attendance");
    achievements.push(`🌟 Excellent Attendance! ${summary.attendanceRate}% attendance rate.`);
  }

  // Good Attendance Badge
  if (summary.attendanceRate >= 85 && summary.attendanceRate < 95 && summary.totalRecords >= 10) {
    badges.push("Good Attendance");
    achievements.push(`✨ Good Attendance! Keep up the ${summary.attendanceRate}% attendance rate.`);
  }

  // Punctuality Badge
  if (summary.lateCount === 0 && summary.totalRecords >= 10) {
    badges.push("Always On Time");
    achievements.push(`⏰ Always On Time! No late arrivals in ${summary.totalRecords} classes.`);
  }

  // Low Attendance Alert
  if (summary.attendanceRate < 75 && summary.totalRecords >= 5) {
    alerts.push(`⚠️ Low Attendance Warning: Your attendance rate is ${summary.attendanceRate}%. Aim for at least 85%.`);
  }

  // Frequent Lateness Alert
  if (summary.lateRate > 20 && summary.totalRecords >= 5) {
    alerts.push(`⏰ Punctuality Alert: You've been late to ${summary.lateCount} classes. Try to arrive on time.`);
  }

  // Recent Absences Alert
  const recentAttendances = attendances.slice(0, 5); // Last 5 records
  const recentAbsences = recentAttendances.filter(a => a.status === "ABSENT").length;
  if (recentAbsences >= 3) {
    alerts.push(`📚 Recent Absences: You've missed ${recentAbsences} of your last 5 classes. Stay engaged!`);
  }

  // Improvement Recognition
  if (attendances.length >= 20) {
    const firstHalf = attendances.slice(Math.floor(attendances.length / 2));
    const secondHalf = attendances.slice(0, Math.floor(attendances.length / 2));
    
    const firstHalfRate = Math.round((firstHalf.filter(a => a.status === "PRESENT").length / firstHalf.length) * 100);
    const secondHalfRate = Math.round((secondHalf.filter(a => a.status === "PRESENT").length / secondHalf.length) * 100);
    
    if (secondHalfRate > firstHalfRate + 10) {
      achievements.push(`📈 Great Improvement! Your attendance improved from ${firstHalfRate}% to ${secondHalfRate}%.`);
    }
  }

  return {
    badges,
    alerts,
    achievements,
    streaks: calculateStreaks(attendances),
  };
}

function calculateStreaks(attendances: any[]) {
  if (attendances.length === 0) return { current: 0, longest: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort by date (oldest first) for streak calculation
  const sortedAttendances = [...attendances].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedAttendances.forEach((attendance, index) => {
    if (attendance.status === "PRESENT") {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  // Calculate current streak (from most recent backwards)
  const reverseAttendances = [...attendances].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const attendance of reverseAttendances) {
    if (attendance.status === "PRESENT") {
      currentStreak++;
    } else {
      break;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

async function getStudentAttendanceAnalytics(attendances: any[], student: any, filters: any) {
  const summary = calculateAttendanceSummary(attendances);
  const subjectStats = calculateSubjectWiseStats(attendances);
  const trends = calculateAttendanceTrends(attendances);
  const motivationalData = calculateMotivationalData(attendances, summary);

  // Monthly breakdown
  const monthlyStats = calculateMonthlyStats(attendances);
  
  // Weekly breakdown
  const weeklyStats = calculateWeeklyStats(attendances);

  const analytics = {
    summary,
    subjectStats,
    trends,
    monthlyStats,
    weeklyStats,
    motivationalData,
    insights: generateInsights(summary, subjectStats, trends),
  };

  return NextResponse.json({
    student,
    analytics,
    filters,
  });
}

function calculateMonthlyStats(attendances: any[]) {
  const monthlyStats: Record<string, any> = {};

  attendances.forEach(attendance => {
    const date = new Date(attendance.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {
        month: monthKey,
        monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      };
    }

    monthlyStats[monthKey].totalRecords++;
    if (attendance.status === "PRESENT") monthlyStats[monthKey].presentCount++;
    if (attendance.status === "ABSENT") monthlyStats[monthKey].absentCount++;
    if (attendance.status === "LATE") monthlyStats[monthKey].lateCount++;
  });

  // Calculate rates
  return Object.values(monthlyStats)
    .map((stats: any) => ({
      ...stats,
      attendanceRate: stats.totalRecords > 0 ? 
        Math.round((stats.presentCount / stats.totalRecords) * 100) : 0,
    }))
    .sort((a: any, b: any) => a.month.localeCompare(b.month));
}

function calculateWeeklyStats(attendances: any[]) {
  const weeklyStats: Record<string, any> = {};

  attendances.forEach(attendance => {
    const date = new Date(attendance.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = {
        week: weekKey,
        weekStart: weekStart.toLocaleDateString(),
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      };
    }

    weeklyStats[weekKey].totalRecords++;
    if (attendance.status === "PRESENT") weeklyStats[weekKey].presentCount++;
    if (attendance.status === "ABSENT") weeklyStats[weekKey].absentCount++;
    if (attendance.status === "LATE") weeklyStats[weekKey].lateCount++;
  });

  // Calculate rates
  return Object.values(weeklyStats)
    .map((stats: any) => ({
      ...stats,
      attendanceRate: stats.totalRecords > 0 ? 
        Math.round((stats.presentCount / stats.totalRecords) * 100) : 0,
    }))
    .sort((a: any, b: any) => a.week.localeCompare(b.week));
}

function generateInsights(summary: any, subjectStats: any[], trends: any[]) {
  const insights: string[] = [];

  // Overall performance insight
  if (summary.attendanceRate >= 95) {
    insights.push("🌟 Outstanding! Your attendance is excellent across all subjects.");
  } else if (summary.attendanceRate >= 85) {
    insights.push("✨ Good job! Your attendance is above average.");
  } else if (summary.attendanceRate >= 75) {
    insights.push("📚 Your attendance needs improvement. Aim for 85% or higher.");
  } else {
    insights.push("⚠️ Critical: Your attendance is below acceptable levels. Please speak with your advisor.");
  }

  // Subject-specific insights
  const bestSubject = subjectStats[0];
  const worstSubject = subjectStats[subjectStats.length - 1];
  
  if (bestSubject && worstSubject && bestSubject.attendanceRate !== worstSubject.attendanceRate) {
    insights.push(`📊 Best attendance: ${bestSubject.subject.name} (${bestSubject.attendanceRate}%). Consider what motivates you in this subject.`);
    if (worstSubject.attendanceRate < 80) {
      insights.push(`📉 Needs attention: ${worstSubject.subject.name} (${worstSubject.attendanceRate}%). Try to improve attendance in this subject.`);
    }
  }

  // Trend insights
  if (trends.length >= 5) {
    const recentTrends = trends.slice(-5);
    const averageRecentRate = Math.round(recentTrends.reduce((sum, trend) => sum + trend.attendanceRate, 0) / recentTrends.length);
    
    if (averageRecentRate > summary.attendanceRate + 5) {
      insights.push("📈 Great news! Your recent attendance has been improving.");
    } else if (averageRecentRate < summary.attendanceRate - 5) {
      insights.push("📉 Your recent attendance has declined. Focus on getting back on track.");
    }
  }

  return insights;
}
