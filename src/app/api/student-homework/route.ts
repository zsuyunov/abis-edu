import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const headerStudentId = request.headers.get('x-user-id');
    let authenticatedUserId = headerStudentId;
    let session = null;

    if (!headerStudentId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const url = new URL(request.url);
    const requestedStudentId = url.searchParams.get("studentId") || authenticatedUserId;
    const subjectId = url.searchParams.get("subjectId");
    const status = url.searchParams.get("status") || "ALL"; // ALL, PENDING, COMPLETED, MISSED
    const view = url.searchParams.get("view") || "list"; // list, timeline, analytics
    const academicYearId = url.searchParams.get("academicYearId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Verify student can only access their own homework
    if (authenticatedUserId !== requestedStudentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Ensure we have a valid student ID
    if (!requestedStudentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Get student information with branch and class details
    const student = await prisma.student.findUnique({
      where: { id: requestedStudentId },
      include: {
        branch: true,
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Validate student has required associations
    if (!student.branchId || !student.classId || !student.class) {
      return NextResponse.json({ error: "Student profile incomplete" }, { status: 400 });
    }

    // Get student's branch and class for filtering
    const studentBranchId = student.branchId;
    const studentClassId = student.classId;
    const studentAcademicYearId = student.class.academicYear.id;

    // Get available academic years for the student (scoped by branch)
    const availableAcademicYears = await prisma.academicYear.findMany({
      where: {
        classes: {
          some: {
            branchId: studentBranchId,
            students: {
              some: { id: requestedStudentId },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Get subjects taught in student's class (scoped by branch)
    const availableSubjects = await prisma.subject.findMany({
      where: {
        homework: {
          some: {
            branchId: studentBranchId,
            classId: studentClassId,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Build filter conditions for homework with strict branch and class restrictions
    const homeworkWhere: any = {
      branchId: studentBranchId, // Always filter by student's branch
      classId: studentClassId,   // Always filter by student's class
      status: "ACTIVE", // Only show active homework to students
    };

    // Only filter by academic year if explicitly requested
    if (academicYearId && academicYearId !== "undefined" && academicYearId !== "") {
      homeworkWhere.academicYearId = parseInt(academicYearId);
      console.log('Filtering by specific academic year:', academicYearId);
    } else {
      // Don't filter by academic year if not specified - show all homework for student
      console.log('No academic year filter specified - showing all homework for student');
    }

    if (subjectId) homeworkWhere.subjectId = parseInt(subjectId);

    if (startDate && endDate) {
      homeworkWhere.assignedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    console.log('Student homework query filters:', homeworkWhere);
    console.log('Student info:', {
      id: student.id,
      branchId: studentBranchId,
      classId: studentClassId,
      academicYearId: studentAcademicYearId
    });

    // Debug: Check all homework for this student's branch and class
    const allHomeworkForStudent = await prisma.homework.findMany({
      where: {
        branchId: studentBranchId,
        classId: studentClassId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        branchId: true,
        classId: true,
        academicYearId: true,
        subjectId: true,
        teacherId: true,
        status: true,
      },
    });
    console.log('All homework for student branch/class:', allHomeworkForStudent.length);
    console.log('All homework details:', allHomeworkForStudent);

    // Get homework assignments with submission data
    const homework = await prisma.homework.findMany({
      where: homeworkWhere,
      include: {
        subject: {
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
            teacherId: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            shortName: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileUrl: true,
            fileSize: true,
            duration: true,
            mimeType: true,
          },
        },
        submissions: {
          where: {
            studentId: requestedStudentId, // Only get this student's submission
          },
          include: {
            attachments: {
              select: {
                id: true,
                fileName: true,
                originalName: true,
                fileType: true,
                fileUrl: true,
                fileSize: true,
                duration: true,
                mimeType: true,
              },
            },
          },
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { assignedDate: "desc" },
      ],
    });

    console.log('Found homework count:', homework.length);
    console.log('Homework details:', homework.map(hw => ({
      id: hw.id,
      title: hw.title,
      branchId: hw.branchId,
      classId: hw.classId,
      academicYearId: hw.academicYearId,
      subjectId: hw.subjectId,
      teacherId: hw.teacherId
    })));

    // Calculate submission status for each homework
    const homeworkWithStatus = homework.map(hw => {
      const submission = hw.submissions[0]; // Should be only one submission per student
      const now = new Date();
      const dueDate = new Date(hw.dueDate);
      const isOverdue = now > dueDate;
      
      let homeworkStatus: "PENDING" | "COMPLETED" | "MISSED" | "LATE";
      
      // Only consider it submitted if there's actual content AND a valid submission date
      const hasActualSubmission = submission && 
        submission.status !== "NOT_SUBMITTED" && 
        submission.submissionDate && 
        submission.submissionDate.getTime() > 0 && // Not epoch time
        (submission.content || (submission.attachments && submission.attachments.length > 0));
      
      if (hasActualSubmission) {
        homeworkStatus = submission.isLate ? "LATE" : "COMPLETED";
      } else {
        // If no real submission, check if overdue
        homeworkStatus = isOverdue ? "MISSED" : "PENDING";
      }

      return {
        ...hw,
        submissionStatus: homeworkStatus,
        submission: hasActualSubmission ? submission : null, // Only show submission if it's real
        isOverdue,
        daysUntilDue: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });

    // Filter by status if specified
    let filteredHomework = homeworkWithStatus;
    if (status !== "ALL") {
      filteredHomework = homeworkWithStatus.filter(hw => hw.submissionStatus === status);
    }

    if (view === "timeline") {
      return getStudentHomeworkTimeline(filteredHomework, student);
    }

    if (view === "analytics") {
      return getStudentHomeworkAnalytics(homeworkWithStatus, student, {
        subjectId,
        academicYearId,
        startDate,
        endDate,
      });
    }

    // Calculate overall statistics
    const stats = calculateStudentHomeworkStats(homeworkWithStatus);

    // Calculate motivational features
    const motivationalData = calculateMotivationalFeatures(homeworkWithStatus, student);

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        branch: student.branch,
        class: student.class,
      },
      homework: filteredHomework,
      stats,
      motivationalData,
      availableAcademicYears,
      availableSubjects,
      filters: {
        subjectId,
        status,
        academicYearId,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error("Error fetching student homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework data" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateStudentHomeworkStats(homework: any[]) {
  const totalHomework = homework.length;
  const completedCount = homework.filter(hw => hw.submissionStatus === "COMPLETED").length;
  const lateCount = homework.filter(hw => hw.submissionStatus === "LATE").length;
  const pendingCount = homework.filter(hw => hw.submissionStatus === "PENDING").length;
  const missedCount = homework.filter(hw => hw.submissionStatus === "MISSED").length;

  const completionRate = totalHomework > 0 ? Math.round((completedCount / totalHomework) * 100) : 0;
  const onTimeRate = (completedCount + lateCount) > 0 ? Math.round((completedCount / (completedCount + lateCount)) * 100) : 0;

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = homework.filter(hw => 
    hw.submissionStatus === "PENDING" && hw.daysUntilDue >= 0 && hw.daysUntilDue <= 7
  ).length;

  return {
    totalHomework,
    completedCount,
    lateCount,
    pendingCount,
    missedCount,
    completionRate,
    onTimeRate,
    upcomingDeadlines,
  };
}

function calculateMotivationalFeatures(homework: any[], student: any) {
  const completedHomework = homework.filter(hw => hw.submissionStatus === "COMPLETED");
  const lateHomework = homework.filter(hw => hw.submissionStatus === "LATE");
  
  // Calculate current streak (consecutive on-time submissions)
  const sortedHomework = [...homework]
    .filter(hw => hw.submissionStatus === "COMPLETED" || hw.submissionStatus === "LATE")
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  let currentStreak = 0;
  for (const hw of sortedHomework) {
    if (hw.submissionStatus === "COMPLETED") {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate badges
  const badges = [];
  
  // Perfect completion in a subject
  const subjectPerformance: Record<string, { total: number; completed: number }> = {};
  homework.forEach(hw => {
    const subjectName = hw.subject.name;
    if (!subjectPerformance[subjectName]) {
      subjectPerformance[subjectName] = { total: 0, completed: 0 };
    }
    subjectPerformance[subjectName].total++;
    if (hw.submissionStatus === "COMPLETED") {
      subjectPerformance[subjectName].completed++;
    }
  });

  Object.entries(subjectPerformance).forEach(([subject, perf]) => {
    if (perf.total >= 5 && perf.completed === perf.total) {
      badges.push({
        id: `perfect_${subject}`,
        title: `${subject} Champion`,
        description: `Perfect completion in ${subject}`,
        icon: "🏆",
        color: "gold",
        earnedAt: new Date(),
      });
    }
  });

  // Streak badges
  if (currentStreak >= 5) {
    badges.push({
      id: "streak_5",
      title: "Consistency Star",
      description: `${currentStreak} homework submitted on time in a row`,
      icon: "⭐",
      color: "blue",
      earnedAt: new Date(),
    });
  }

  if (currentStreak >= 10) {
    badges.push({
      id: "streak_10",
      title: "Homework Hero",
      description: `${currentStreak} homework submitted on time in a row`,
      icon: "🦸",
      color: "purple",
      earnedAt: new Date(),
    });
  }

  // Completion rate badges
  const stats = calculateStudentHomeworkStats(homework);
  if (stats.completionRate >= 90 && stats.totalHomework >= 10) {
    badges.push({
      id: "completion_90",
      title: "Homework Master",
      description: `${stats.completionRate}% completion rate`,
      icon: "🎓",
      color: "green",
      earnedAt: new Date(),
    });
  }

  // Early submission badge
  const earlySubmissions = homework.filter(hw => {
    if (hw.submission && hw.submission.submissionDate) {
      const submissionDate = new Date(hw.submission.submissionDate);
      const dueDate = new Date(hw.dueDate);
      return submissionDate < dueDate && hw.submissionStatus === "COMPLETED";
    }
    return false;
  });

  if (earlySubmissions.length >= 5) {
    badges.push({
      id: "early_bird",
      title: "Early Bird",
      description: `${earlySubmissions.length} homework submitted early`,
      icon: "🐦",
      color: "orange",
      earnedAt: new Date(),
    });
  }

  return {
    currentStreak,
    badges,
    stats: calculateStudentHomeworkStats(homework),
    encouragement: generateEncouragement(homework, currentStreak),
  };
}

function generateEncouragement(homework: any[], streak: number) {
  const stats = calculateStudentHomeworkStats(homework);
  const encouragements = [];

  if (streak >= 5) {
    encouragements.push(`🔥 Amazing ${streak}-day streak! Keep up the excellent work!`);
  } else if (streak >= 2) {
    encouragements.push(`⭐ Great ${streak}-day streak! You're building great habits!`);
  }

  if (stats.completionRate >= 90) {
    encouragements.push(`🎯 Outstanding ${stats.completionRate}% completion rate!`);
  } else if (stats.completionRate >= 75) {
    encouragements.push(`👍 Good ${stats.completionRate}% completion rate! You're doing well!`);
  }

  if (stats.upcomingDeadlines > 0) {
    encouragements.push(`📅 You have ${stats.upcomingDeadlines} homework due soon. Stay on track!`);
  }

  if (stats.onTimeRate >= 90) {
    encouragements.push(`⏰ Excellent punctuality! ${stats.onTimeRate}% on-time submissions!`);
  }

  if (encouragements.length === 0) {
    encouragements.push("📚 Keep working hard! Every submission counts towards your success!");
  }

  return encouragements;
}

async function getStudentHomeworkTimeline(homework: any[], student: any) {
  // Group homework by month for timeline view
  const timelineData: Record<string, any[]> = {};
  
  homework.forEach(hw => {
    const monthKey = new Date(hw.assignedDate).toISOString().slice(0, 7); // YYYY-MM
    if (!timelineData[monthKey]) {
      timelineData[monthKey] = [];
    }
    timelineData[monthKey].push(hw);
  });

  const timeline = Object.entries(timelineData)
    .map(([month, homeworkList]) => ({
      month,
      monthName: new Date(month + "-01").toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long" 
      }),
      homework: homeworkList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      stats: calculateStudentHomeworkStats(homeworkList),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return NextResponse.json({
    student,
    timeline,
    overallStats: calculateStudentHomeworkStats(homework),
  });
}

async function getStudentHomeworkAnalytics(homework: any[], student: any, filters: any) {
  const analytics = {
    overallStats: calculateStudentHomeworkStats(homework),
    subjectPerformance: calculateSubjectPerformance(homework),
    weeklyProgress: calculateWeeklyProgress(homework),
    monthlyTrends: calculateMonthlyTrends(homework),
    streakAnalysis: calculateStreakAnalysis(homework),
    insights: generateStudentInsights(homework),
  };

  return NextResponse.json({
    student,
    analytics,
    filters,
  });
}

function calculateSubjectPerformance(homework: any[]) {
  const subjectPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const subjectId = hw.subjectId;
    const subjectName = hw.subject.name;
    
    if (!subjectPerformance[subjectId]) {
      subjectPerformance[subjectId] = {
        subject: { id: subjectId, name: subjectName },
        total: 0,
        completed: 0,
        late: 0,
        missed: 0,
        pending: 0,
        completionRate: 0,
        onTimeRate: 0,
      };
    }

    const perf = subjectPerformance[subjectId];
    perf.total++;
    
    switch (hw.submissionStatus) {
      case "COMPLETED":
        perf.completed++;
        break;
      case "LATE":
        perf.late++;
        break;
      case "MISSED":
        perf.missed++;
        break;
      case "PENDING":
        perf.pending++;
        break;
    }
  });

  // Calculate rates
  Object.values(subjectPerformance).forEach((perf: any) => {
    perf.completionRate = perf.total > 0 ? Math.round(((perf.completed + perf.late) / perf.total) * 100) : 0;
    perf.onTimeRate = (perf.completed + perf.late) > 0 ? Math.round((perf.completed / (perf.completed + perf.late)) * 100) : 0;
  });

  return Object.values(subjectPerformance)
    .sort((a: any, b: any) => b.completionRate - a.completionRate);
}

function calculateWeeklyProgress(homework: any[]) {
  const weeklyData: Record<string, any> = {};

  homework.forEach(hw => {
    const weekKey = getWeekKey(new Date(hw.dueDate));
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekKey,
        total: 0,
        completed: 0,
        late: 0,
        missed: 0,
        completionRate: 0,
      };
    }

    weeklyData[weekKey].total++;
    
    switch (hw.submissionStatus) {
      case "COMPLETED":
        weeklyData[weekKey].completed++;
        break;
      case "LATE":
        weeklyData[weekKey].late++;
        break;
      case "MISSED":
        weeklyData[weekKey].missed++;
        break;
    }
  });

  // Calculate completion rates
  Object.values(weeklyData).forEach((week: any) => {
    week.completionRate = week.total > 0 ? Math.round(((week.completed + week.late) / week.total) * 100) : 0;
  });

  return Object.values(weeklyData)
    .sort((a: any, b: any) => a.week.localeCompare(b.week))
    .slice(-12); // Last 12 weeks
}

function calculateMonthlyTrends(homework: any[]) {
  const monthlyData: Record<string, any> = {};

  homework.forEach(hw => {
    const monthKey = new Date(hw.dueDate).toISOString().slice(0, 7); // YYYY-MM
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        monthName: new Date(monthKey + "-01").toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long" 
        }),
        total: 0,
        completed: 0,
        completionRate: 0,
      };
    }

    monthlyData[monthKey].total++;
    if (hw.submissionStatus === "COMPLETED" || hw.submissionStatus === "LATE") {
      monthlyData[monthKey].completed++;
    }
  });

  // Calculate completion rates
  Object.values(monthlyData).forEach((month: any) => {
    month.completionRate = month.total > 0 ? Math.round((month.completed / month.total) * 100) : 0;
  });

  return Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month));
}

function calculateStreakAnalysis(homework: any[]) {
  const sortedHomework = [...homework]
    .filter(hw => hw.submissionStatus === "COMPLETED" || hw.submissionStatus === "LATE")
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak
  for (const hw of sortedHomework) {
    if (hw.submissionStatus === "COMPLETED") {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  sortedHomework.forEach(hw => {
    if (hw.submissionStatus === "COMPLETED") {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  return {
    currentStreak,
    longestStreak,
    streakHistory: calculateStreakHistory(sortedHomework),
  };
}

function calculateStreakHistory(homework: any[]) {
  const history: Array<{ length: number; endDate: string }> = [];
  let currentStreak = 0;
  
  homework.forEach((hw, index) => {
    if (hw.submissionStatus === "COMPLETED") {
      currentStreak++;
    } else {
      if (currentStreak > 0) {
        history.push({
          length: currentStreak,
          endDate: homework[index - 1]?.dueDate,
        });
      }
      currentStreak = 0;
    }
  });

  return history.sort((a, b) => b.length - a.length).slice(0, 5); // Top 5 streaks
}

function generateStudentInsights(homework: any[]) {
  const insights: string[] = [];
  const stats = calculateStudentHomeworkStats(homework);

  if (homework.length === 0) {
    insights.push("📚 No homework assignments yet. Check back soon!");
    return insights;
  }

  // Completion insights
  if (stats.completionRate >= 95) {
    insights.push("🌟 Outstanding! You're completing almost all your homework!");
  } else if (stats.completionRate >= 85) {
    insights.push("👍 Great job! You're staying on top of your homework!");
  } else if (stats.completionRate >= 70) {
    insights.push("📈 Good progress! Try to improve your completion rate a bit more.");
  } else {
    insights.push("💪 Focus on completing more homework to improve your academic performance.");
  }

  // Punctuality insights
  if (stats.onTimeRate >= 90) {
    insights.push("⏰ Excellent time management! You submit homework on time consistently.");
  } else if (stats.onTimeRate < 70) {
    insights.push("🕐 Try to start homework earlier to avoid late submissions.");
  }

  // Deadline insights
  if (stats.upcomingDeadlines > 3) {
    insights.push(`📅 You have ${stats.upcomingDeadlines} homework due soon. Plan your time wisely!`);
  } else if (stats.upcomingDeadlines > 0) {
    insights.push(`📋 ${stats.upcomingDeadlines} homework coming up. You've got this!`);
  }

  // Subject-specific insights
  const subjectPerf = calculateSubjectPerformance(homework);
  const weakestSubject = subjectPerf.find((s: any) => s.completionRate < 70);
  if (weakestSubject) {
    insights.push(`📖 Consider focusing more on ${weakestSubject.subject.name} (${weakestSubject.completionRate}% completion rate).`);
  }

  const strongestSubject = subjectPerf[0];
  if (strongestSubject && strongestSubject.completionRate >= 90) {
    insights.push(`🏆 You're excelling in ${strongestSubject.subject.name}! Keep up the great work!`);
  }

  return insights;
}

function getWeekKey(date: Date) {
  const year = date.getFullYear();
  const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}