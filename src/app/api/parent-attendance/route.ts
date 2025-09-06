import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const parentId = url.searchParams.get("parentId") || session.id;
    const childId = url.searchParams.get("childId");
    const branchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const timeFilter = url.searchParams.get("timeFilter") || "current"; // current, past
    const view = url.searchParams.get("view") || "overview"; // overview, analytics, comparison, export
    const includeClassAverage = url.searchParams.get("includeClassAverage") === "true";
    
    // Verify parent can only access their own data
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent information with children details
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            class: {
              include: {
                academicYear: true,
                branch: true,
                subjects: true,
              },
            },
            branch: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    if (parent.students.length === 0) {
      return NextResponse.json({
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
        children: [],
        attendances: [],
        summary: {},
        message: "No children found"
      });
    }

    // Get all unique branches from parent's children
    const childrenBranches = [...new Set(parent.students.map(child => child.branchId))];
    
    // Get available academic years for children (scoped by children's branches)
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
                  parentId: parentId 
                },
              },
              branchId: {
                in: childrenBranches, // Only academic years in children's branches
              },
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
                  parentId: parentId 
                },
              },
              branchId: {
                in: childrenBranches, // Only academic years in children's branches
              },
            },
          },
        },
        orderBy: { startDate: "desc" },
      });
    }

    // Handle multiple children comparison view
    if (view === "comparison" && parent.students.length > 1) {
      return getChildrenAttendanceComparison(parent, {
        academicYearId,
        subjectId,
        startDate,
        endDate,
        timeFilter,
        availableAcademicYears,
        includeClassAverage,
      });
    }

    // Determine target child
    const targetChild = childId 
      ? parent.students.find(s => s.id === childId)
      : parent.students[0];

    if (!targetChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // If branch is specified, verify it matches the child's branch
    if (branchId && parseInt(branchId) !== targetChild.branchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Determine which academic year to use
    let targetAcademicYearId;
    if (academicYearId) {
      targetAcademicYearId = parseInt(academicYearId);
    } else if (timeFilter === "current") {
      targetAcademicYearId = availableAcademicYears[0]?.id || targetChild.class.academicYearId;
    } else {
      targetAcademicYearId = availableAcademicYears[0]?.id;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({
        parent: {
          id: parent.id,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
        children: parent.students.map(child => ({
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentId: child.studentId,
          class: child.class,
          branch: child.branch,
        })),
        selectedChild: targetChild,
        attendances: [],
        summary: {},
        availableAcademicYears,
        message: "No academic year data available"
      });
    }

    // Build filter conditions for attendance records with branch restriction
    const attendanceWhere: any = {
      studentId: targetChild.id,
      branchId: targetChild.branchId, // Always filter by child's branch
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

    // Get subjects for filter options (scoped by child's branch)
    const subjects = await prisma.subject.findMany({
      where: {
        classes: {
          some: {
            id: targetChild.classId,
            branchId: targetChild.branchId, // Ensure subjects are from child's branch
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (view === "analytics") {
      return getParentAttendanceAnalytics(attendances, targetChild, parent, {
        academicYearId: targetAcademicYearId,
        subjectId,
        startDate,
        endDate,
        includeClassAverage,
      });
    }

    // Calculate summary statistics
    const summary = calculateAttendanceSummary(attendances);
    
    // Calculate subject-wise statistics
    const subjectStats = calculateSubjectWiseStats(attendances);
    
    // Calculate attendance trends
    const trends = calculateAttendanceTrends(attendances);
    
    // Get class average comparison if requested
    let classComparison = null;
    if (includeClassAverage) {
      classComparison = await getClassAverageComparison(targetChild, targetAcademicYearId, attendanceWhere);
    }

    // Calculate parent-specific insights
    const parentInsights = calculateParentInsights(attendances, summary, targetChild);

    // Generate attendance alerts
    const alerts = generateParentAlerts(attendances, summary, targetChild);

    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
      },
      children: parent.students.map(child => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentId: child.studentId,
        class: child.class,
        branch: child.branch,
      })),
      selectedChild: {
        id: targetChild.id,
        firstName: targetChild.firstName,
        lastName: targetChild.lastName,
        studentId: targetChild.studentId,
        class: targetChild.class,
        branch: targetChild.branch,
      },
      attendances,
      summary,
      subjectStats,
      trends,
      classComparison,
      parentInsights,
      alerts,
      availableAcademicYears,
      subjects,
      timeFilter,
      view,
    });

  } catch (error) {
    console.error("Error fetching parent attendance:", error);
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

async function getClassAverageComparison(child: any, academicYearId: number, baseWhere: any) {
  try {
    // Get all students in the same class
    const classAttendances = await prisma.attendance.findMany({
      where: {
        classId: child.classId,
        branchId: child.branchId,
        academicYearId: academicYearId,
        date: baseWhere.date || undefined,
        ...(baseWhere.subjectId && { subjectId: baseWhere.subjectId }),
      },
    });

    // Calculate class statistics
    const classSummary = calculateAttendanceSummary(classAttendances);
    
    // Get student count in class
    const studentsInClass = await prisma.student.count({
      where: {
        classId: child.classId,
        branchId: child.branchId,
        status: "ACTIVE",
      },
    });

    return {
      classAverage: classSummary,
      studentsInClass,
      comparisonDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calculating class average:", error);
    return null;
  }
}

function calculateParentInsights(attendances: any[], summary: any, child: any) {
  const insights: string[] = [];

  // Overall performance insight
  if (summary.attendanceRate >= 95) {
    insights.push(`🌟 Excellent! ${child.firstName} has outstanding attendance (${summary.attendanceRate}%).`);
  } else if (summary.attendanceRate >= 85) {
    insights.push(`✨ Good job! ${child.firstName}'s attendance is above average (${summary.attendanceRate}%).`);
  } else if (summary.attendanceRate >= 75) {
    insights.push(`📚 ${child.firstName}'s attendance needs improvement (${summary.attendanceRate}%). Consider discussing the importance of regular attendance.`);
  } else {
    insights.push(`⚠️ Critical: ${child.firstName}'s attendance is concerning (${summary.attendanceRate}%). Please contact the school immediately.`);
  }

  // Punctuality insight
  if (summary.lateCount > 0) {
    const latePercentage = Math.round((summary.lateCount / summary.totalRecords) * 100);
    if (latePercentage > 15) {
      insights.push(`⏰ Punctuality concern: ${child.firstName} has been late to ${summary.lateCount} classes (${latePercentage}%). Consider earlier morning routines.`);
    } else if (latePercentage > 5) {
      insights.push(`⏰ Minor punctuality issue: ${child.firstName} has been late ${summary.lateCount} times. Monitor morning routine.`);
    }
  } else if (summary.totalRecords >= 10) {
    insights.push(`⏰ Perfect punctuality! ${child.firstName} has never been late to class.`);
  }

  // Recent trends
  const recentAttendances = attendances.slice(0, 10); // Last 10 records
  if (recentAttendances.length >= 5) {
    const recentAbsences = recentAttendances.filter(a => a.status === "ABSENT").length;
    if (recentAbsences >= 3) {
      insights.push(`📉 Recent concern: ${child.firstName} has missed ${recentAbsences} of the last ${recentAttendances.length} classes.`);
    } else if (recentAbsences === 0) {
      insights.push(`📈 Recent improvement: ${child.firstName} has perfect attendance in the last ${recentAttendances.length} classes!`);
    }
  }

  return insights;
}

function generateParentAlerts(attendances: any[], summary: any, child: any) {
  const alerts: any[] = [];

  // Critical attendance alert
  if (summary.attendanceRate < 75) {
    alerts.push({
      type: "critical",
      title: "Critical Attendance Alert",
      message: `${child.firstName}'s attendance rate is ${summary.attendanceRate}%, which is below the acceptable minimum. Please contact the school to discuss support options.`,
      icon: "🚨",
      priority: "high"
    });
  }

  // Low attendance warning
  if (summary.attendanceRate >= 75 && summary.attendanceRate < 85) {
    alerts.push({
      type: "warning",
      title: "Attendance Improvement Needed",
      message: `${child.firstName}'s attendance rate is ${summary.attendanceRate}%. Aim for at least 85% for optimal academic success.`,
      icon: "⚠️",
      priority: "medium"
    });
  }

  // Frequent lateness alert
  if (summary.lateCount > 5 && summary.totalRecords >= 20) {
    const latePercentage = Math.round((summary.lateCount / summary.totalRecords) * 100);
    alerts.push({
      type: "info",
      title: "Punctuality Notice",
      message: `${child.firstName} has been late to ${summary.lateCount} classes (${latePercentage}%). Consider adjusting morning routines.`,
      icon: "⏰",
      priority: "low"
    });
  }

  // Recent absence pattern
  const recentAttendances = attendances.slice(0, 7); // Last week
  const recentAbsences = recentAttendances.filter(a => a.status === "ABSENT").length;
  if (recentAbsences >= 3) {
    alerts.push({
      type: "warning",
      title: "Recent Absence Pattern",
      message: `${child.firstName} has missed ${recentAbsences} classes in the past week. Please monitor for any health or other issues.`,
      icon: "📅",
      priority: "medium"
    });
  }

  // Positive recognition
  if (summary.attendanceRate >= 95 && summary.totalRecords >= 20) {
    alerts.push({
      type: "success",
      title: "Excellent Attendance Recognition",
      message: `Congratulations! ${child.firstName} maintains excellent attendance (${summary.attendanceRate}%). Keep up the great work!`,
      icon: "🏆",
      priority: "low"
    });
  }

  return alerts;
}

async function getChildrenAttendanceComparison(parent: any, filters: any) {
  const children = parent.students;
  const childrenComparison = [];

  for (const child of children) {
    // Get attendance for each child
    const attendanceWhere: any = {
      studentId: child.id,
      branchId: child.branchId,
    };

    if (filters.academicYearId) {
      attendanceWhere.academicYearId = parseInt(filters.academicYearId);
    }

    if (filters.subjectId) {
      attendanceWhere.subjectId = parseInt(filters.subjectId);
    }

    if (filters.startDate && filters.endDate) {
      attendanceWhere.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        subject: true,
      },
    });

    const summary = calculateAttendanceSummary(attendances);
    const subjectStats = calculateSubjectWiseStats(attendances);

    childrenComparison.push({
      child: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentId: child.studentId,
        class: child.class,
        branch: child.branch,
      },
      summary,
      subjectStats,
      attendanceCount: attendances.length,
    });
  }

  return NextResponse.json({
    parent: {
      id: parent.id,
      firstName: parent.firstName,
      lastName: parent.lastName,
    },
    view: "comparison",
    childrenComparison,
    availableAcademicYears: filters.availableAcademicYears,
  });
}

async function getParentAttendanceAnalytics(attendances: any[], child: any, parent: any, filters: any) {
  const summary = calculateAttendanceSummary(attendances);
  const subjectStats = calculateSubjectWiseStats(attendances);
  const trends = calculateAttendanceTrends(attendances);
  const parentInsights = calculateParentInsights(attendances, summary, child);
  const alerts = generateParentAlerts(attendances, summary, child);

  // Monthly breakdown
  const monthlyStats = calculateMonthlyStats(attendances);
  
  // Class comparison if enabled
  let classComparison = null;
  if (filters.includeClassAverage) {
    classComparison = await getClassAverageComparison(child, filters.academicYearId, {
      subjectId: filters.subjectId,
      date: filters.startDate && filters.endDate ? {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      } : undefined,
    });
  }

  const analytics = {
    summary,
    subjectStats,
    trends,
    monthlyStats,
    classComparison,
    parentInsights,
    alerts,
    recommendations: generateParentRecommendations(summary, trends, child),
  };

  return NextResponse.json({
    parent,
    selectedChild: child,
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

function generateParentRecommendations(summary: any, trends: any[], child: any) {
  const recommendations: string[] = [];

  // Attendance improvement recommendations
  if (summary.attendanceRate < 85) {
    recommendations.push(`📚 Establish a consistent daily routine to help ${child.firstName} attend school regularly.`);
    recommendations.push(`🏥 Schedule regular health check-ups to prevent illness-related absences.`);
    recommendations.push(`🛏️ Ensure ${child.firstName} gets adequate sleep (8-10 hours per night) for better health and attendance.`);
  }

  // Punctuality recommendations
  if (summary.lateRate > 10) {
    recommendations.push(`⏰ Consider adjusting bedtime to allow for earlier wake-up times.`);
    recommendations.push(`🚌 Plan transportation route and allow extra time for potential delays.`);
    recommendations.push(`👔 Prepare school items the night before to reduce morning rush.`);
  }

  // Positive reinforcement
  if (summary.attendanceRate >= 90) {
    recommendations.push(`🎉 Continue celebrating ${child.firstName}'s excellent attendance with positive reinforcement.`);
    recommendations.push(`🏆 Consider setting up a reward system for maintaining good attendance.`);
  }

  // Communication recommendations
  recommendations.push(`📞 Maintain open communication with ${child.firstName}'s teachers about any attendance concerns.`);
  recommendations.push(`📧 Set up email alerts to stay informed about daily attendance updates.`);

  return recommendations;
}
