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
    
    const session = await AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") || session.id;
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const gradeType = url.searchParams.get("gradeType"); // DAILY, WEEKLY, etc.
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const timeFilter = url.searchParams.get("timeFilter") || "current"; // current, past
    const view = url.searchParams.get("view") || "overview"; // overview, analytics, export
    
    // Verify student can only access their own data
    if (session.id !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get student information with class and academic year details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            academicYear: true,
            branch: true,
          },
        },
        branch: true,
        studentParents: {
          include: {
            parent: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get student's branch for filtering
    const studentBranchId = student.branchId;

    if (!studentBranchId) {
      return NextResponse.json({ error: "Student branch information is missing" }, { status: 400 });
    }

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
      targetAcademicYearId = availableAcademicYears[0]?.id || student.class?.academicYearId;
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
          class: student.class || null,
          branch: student.branch || null,
        },
        grades: [],
        examResults: [],
        availableAcademicYears,
        message: "No academic year data available"
      });
    }

    // Build filter conditions for grades with branch restriction
    const gradeWhere: any = {
      studentId,
      branchId: studentBranchId, // Always filter by student's branch
      academicYearId: targetAcademicYearId,
      status: "ACTIVE",
    };

    if (subjectId) gradeWhere.subjectId = parseInt(subjectId);
    if (gradeType) gradeWhere.type = gradeType;
    if (startDate && endDate) {
      gradeWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get grades with related data
    const grades = await prisma.grade.findMany({
      where: gradeWhere,
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
      },
      orderBy: [
        { date: "desc" },
        { subject: { name: "asc" } },
      ],
    });

    // Build filter conditions for exam results with branch restriction
    const examWhere: any = {
      studentId,
      branchId: studentBranchId, // Always filter by student's branch
      exam: {
        academicYearId: targetAcademicYearId,
        branchId: studentBranchId, // Ensure exam is also from student's branch
        status: "ACTIVE",
      },
    };

    if (subjectId) {
      examWhere.exam.subjectId = parseInt(subjectId);
    }

    if (startDate && endDate) {
      examWhere.exam.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get exam results with related data
    const examResults = await prisma.examResult.findMany({
      where: examWhere,
      include: {
        exam: {
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
          },
        },
      },
      orderBy: [
        { exam: { date: "desc" } },
        { exam: { subject: { name: "asc" } } },
      ],
    });

    // Get subjects for filter options (scoped by student's branch)
    const subjects = await prisma.subject.findMany({
      where: {
        TeacherAssignment: {
          some: {
            classId: student.classId || 0, // Handle null classId
            branchId: studentBranchId, // Ensure subjects are from student's branch
            status: "ACTIVE",
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (view === "analytics") {
      return getStudentAnalytics(grades, examResults, student, {
        academicYearId: targetAcademicYearId,
        subjectId,
        gradeType,
        startDate,
        endDate,
        timeFilter,
      });
    }

    // Calculate summary statistics
    const gradeValues = grades.map(g => g.value);
    const examMarks = examResults.map(r => (r.marksObtained / r.exam.fullMarks) * 100);
    const allScores = [...gradeValues, ...examMarks];

    const summary = {
      totalGrades: grades.length,
      totalExams: examResults.length,
      averageGrade: gradeValues.length > 0 ? 
        Math.round((gradeValues.reduce((sum, v) => sum + v, 0) / gradeValues.length) * 100) / 100 : 0,
      averageExamScore: examMarks.length > 0 ? 
        Math.round((examMarks.reduce((sum, v) => sum + v, 0) / examMarks.length) * 100) / 100 : 0,
      overallAverage: allScores.length > 0 ? 
        Math.round((allScores.reduce((sum, v) => sum + v, 0) / allScores.length) * 100) / 100 : 0,
      highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
      examPassRate: examResults.length > 0 ? 
        Math.round((examResults.filter(r => r.status === "PASS").length / examResults.length) * 100) : 0,
      gradesByType: getGradesByType(grades),
      recentGrades: grades.slice(0, 5),
      recentExams: examResults.slice(0, 3),
    };

    // Calculate per-subject statistics
    const subjectStats = subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subjectId === subject.id);
      const subjectExams = examResults.filter(r => r.exam.subjectId === subject.id);
      const subjectGradeValues = subjectGrades.map(g => g.value);
      const subjectExamMarks = subjectExams.map(r => (r.marksObtained / r.exam.fullMarks) * 100);
      const allSubjectScores = [...subjectGradeValues, ...subjectExamMarks];

      return {
        subject: {
          id: subject.id,
          name: subject.name,
        },
        totalGrades: subjectGrades.length,
        totalExams: subjectExams.length,
        averageGrade: subjectGradeValues.length > 0 ? 
          Math.round((subjectGradeValues.reduce((sum, v) => sum + v, 0) / subjectGradeValues.length) * 100) / 100 : 0,
        averageExamScore: subjectExamMarks.length > 0 ? 
          Math.round((subjectExamMarks.reduce((sum, v) => sum + v, 0) / subjectExamMarks.length) * 100) / 100 : 0,
        overallAverage: allSubjectScores.length > 0 ? 
          Math.round((allSubjectScores.reduce((sum, v) => sum + v, 0) / allSubjectScores.length) * 100) / 100 : 0,
        passRate: subjectExams.length > 0 ? 
          Math.round((subjectExams.filter(r => r.status === "PASS").length / subjectExams.length) * 100) : 0,
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class || null,
        branch: student.branch || null,
        parent: student.studentParents?.[0]?.parent || null,
      },
      grades,
      examResults,
      summary,
      subjectStats,
      availableAcademicYears,
      subjects,
      currentAcademicYear: availableAcademicYears.find(ay => ay.id === targetAcademicYearId),
      timeFilter,
      view,
    });

  } catch (error) {
    console.error("Error fetching student gradebook:", error);
    return NextResponse.json(
      { error: "Failed to fetch gradebook data" },
      { status: 500 }
    );
  }
}

// Helper functions
function getGradesByType(grades: any[]) {
  const gradesByType: Record<string, number> = {};
  grades.forEach(grade => {
    gradesByType[grade.type] = (gradesByType[grade.type] || 0) + 1;
  });
  return gradesByType;
}

async function getStudentAnalytics(grades: any[], examResults: any[], student: any, filters: any) {
  // Calculate detailed analytics
  const gradeValues = grades.map(g => g.value);
  const examMarks = examResults.map(r => (r.marksObtained / r.exam.fullMarks) * 100);
  const allScores = [...gradeValues, ...examMarks];

  // Grade distribution
  const gradeDistribution = {
    excellent: allScores.filter(s => s >= 90).length,
    good: allScores.filter(s => s >= 70 && s < 90).length,
    fair: allScores.filter(s => s >= 50 && s < 70).length,
    weak: allScores.filter(s => s < 50).length,
  };

  // Performance trends over time
  const performanceTrends: Record<string, any> = {};
  [...grades, ...examResults.map(r => ({
    ...r,
    value: (r.marksObtained / r.exam.fullMarks) * 100,
    date: r.exam.date,
    subject: r.exam.subject,
    type: 'EXAM'
  }))].forEach((item: any) => {
    const monthKey = `${new Date(item.date).getFullYear()}-${String(new Date(item.date).getMonth() + 1).padStart(2, '0')}`;
    if (!performanceTrends[monthKey]) {
      performanceTrends[monthKey] = {
        month: monthKey,
        scores: [],
        average: 0,
      };
    }
    performanceTrends[monthKey].scores.push(item.value);
  });

  // Calculate monthly averages
  Object.keys(performanceTrends).forEach((month: string) => {
    const trend = performanceTrends[month];
    trend.average = Math.round((trend.scores.reduce((sum: number, s: number) => sum + s, 0) / trend.scores.length) * 100) / 100;
  });

  const trendData = Object.values(performanceTrends).sort((a: any, b: any) => a.month.localeCompare(b.month));

  // Subject-wise performance
  const subjectPerformance: Record<string, any> = {};
  grades.forEach((grade: any) => {
    const subjectId = grade.subject.id;
    if (!subjectPerformance[subjectId]) {
      subjectPerformance[subjectId] = {
        subject: grade.subject,
        grades: [],
        exams: [],
        totalScore: 0,
        count: 0,
      };
    }
    subjectPerformance[subjectId].grades.push(grade);
    subjectPerformance[subjectId].totalScore += grade.value;
    subjectPerformance[subjectId].count++;
  });

  examResults.forEach((result: any) => {
    const subjectId = result.exam.subject.id;
    if (!subjectPerformance[subjectId]) {
      subjectPerformance[subjectId] = {
        subject: result.exam.subject,
        grades: [],
        exams: [],
        totalScore: 0,
        count: 0,
      };
    }
    subjectPerformance[subjectId].exams.push(result);
    const examScore = (result.marksObtained / result.exam.totalMarks) * 100;
    subjectPerformance[subjectId].totalScore += examScore;
    subjectPerformance[subjectId].count++;
  });

  // Calculate subject averages
  const subjectAverages = Object.values(subjectPerformance).map((perf: any) => ({
    subject: perf.subject,
    average: perf.count > 0 ? Math.round((perf.totalScore / perf.count) * 100) / 100 : 0,
    gradeCount: perf.grades.length,
    examCount: perf.exams.length,
    totalCount: perf.count,
  })).sort((a, b) => b.average - a.average);

  // Achievement detection
  const achievements = [];

  // Top performer achievement
  if (allScores.some(s => s >= 95)) {
    const excellentSubjects = subjectAverages.filter(s => s.average >= 95);
    if (excellentSubjects.length > 0) {
      achievements.push({
        id: "top-performer",
        title: "Top Performer",
        description: `Achieved 95%+ average in ${excellentSubjects.map(s => s.subject.name).join(", ")}`,
        icon: "🏆",
        color: "gold",
        earnedAt: new Date().toISOString(),
      });
    }
  }

  // Consistent performer achievement
  const recentScores = allScores.slice(0, 5);
  if (recentScores.length >= 5 && recentScores.every(s => s >= 80)) {
    achievements.push({
      id: "consistent-performer",
      title: "Consistent Performer",
      description: "Maintained 80%+ in last 5 assessments",
      icon: "📈",
      color: "green",
      earnedAt: new Date().toISOString(),
    });
  }

  // Improvement achievement
  if (trendData.length >= 2) {
    const firstMonth = trendData[0] as any;
    const lastMonth = trendData[trendData.length - 1] as any;
    const improvement = lastMonth.average - firstMonth.average;
    if (improvement >= 10) {
      achievements.push({
        id: "improvement",
        title: "Great Improvement",
        description: `Improved by ${Math.round(improvement)}% over time`,
        icon: "🚀",
        color: "blue",
        earnedAt: new Date().toISOString(),
      });
    }
  }

  // Progress alerts
  const alerts = [];

  // Declining performance alert
  if (trendData.length >= 2) {
    const recentMonths = trendData.slice(-2) as any[];
    if (recentMonths.length === 2) {
      const decline = recentMonths[0].average - recentMonths[1].average;
      if (decline >= 8) {
        alerts.push({
          id: "performance-decline",
          type: "warning",
          title: "Performance Alert",
          message: `Your average dropped by ${Math.round(decline)}% this term. Consider reviewing study methods.`,
          icon: "⚠️",
          actionable: true,
        });
      }
    }
  }

  // Low performance in specific subjects
  const weakSubjects = subjectAverages.filter(s => s.average < 50 && s.totalCount >= 3);
  if (weakSubjects.length > 0) {
    alerts.push({
      id: "weak-subjects",
      type: "danger",
      title: "Subjects Need Attention",
      message: `Focus on improving in: ${weakSubjects.map(s => s.subject.name).join(", ")}`,
      icon: "📚",
      actionable: true,
    });
  }

  // High performance encouragement
  if (allScores.length > 0 && Math.max(...allScores) >= 95) {
    alerts.push({
      id: "high-performance",
      type: "success",
      title: "Excellent Work!",
      message: "Keep up the outstanding performance. You're doing great!",
      icon: "🌟",
      actionable: false,
    });
  }

  return NextResponse.json({
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentId: student.studentId,
      class: student.class || null,
      branch: student.branch || null,
    },
    analytics: {
      summary: {
        totalAssessments: allScores.length,
        overallAverage: allScores.length > 0 ? 
          Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 100) / 100 : 0,
        highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
        lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
        gradeDistribution,
        examPassRate: examResults.length > 0 ? 
          Math.round((examResults.filter(r => r.status === "PASS").length / examResults.length) * 100) : 0,
      },
      trends: {
        performanceTrends: trendData,
        subjectAverages,
      },
      achievements,
      alerts,
    },
    filters,
  });
}