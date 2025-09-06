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
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const gradeType = url.searchParams.get("gradeType"); // DAILY, WEEKLY, etc.
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const timeFilter = url.searchParams.get("timeFilter") || "current"; // current, past
    const view = url.searchParams.get("view") || "overview"; // overview, analytics, comparison
    const includeClassAverage = url.searchParams.get("includeClassAverage") === "true";
    
    // Verify parent can only access their own data
    if (session.id !== parentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get parent information with children
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
        grades: [],
        examResults: [],
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
      return getChildrenComparison(parent, {
        academicYearId,
        subjectId,
        gradeType,
        startDate,
        endDate,
        timeFilter,
        availableAcademicYears,
      });
    }

    // Determine target child
    let targetChild;
    if (childId) {
      targetChild = parent.students.find(child => child.id === childId);
    } else {
      targetChild = parent.students[0]; // Default to first child
    }

    if (!targetChild) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
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
        grades: [],
        examResults: [],
        availableAcademicYears,
        message: "No academic year data available"
      });
    }

    // Build filter conditions for grades with branch restriction
    const gradeWhere: any = {
      studentId: targetChild.id,
      branchId: targetChild.branchId, // Always filter by child's branch
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
      studentId: targetChild.id,
      branchId: targetChild.branchId, // Always filter by child's branch
      exam: {
        academicYearId: targetAcademicYearId,
        branchId: targetChild.branchId, // Ensure exam is also from child's branch
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

    // Get class averages if requested
    let classAverages = {};
    if (includeClassAverage) {
      classAverages = await getClassAverages(targetChild.classId, targetAcademicYearId, subjectId);
    }

    // Get subjects for filter options
    const subjects = await prisma.subject.findMany({
      where: {
        classes: {
          some: {
            id: targetChild.classId,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (view === "analytics") {
      return getParentAnalytics(grades, examResults, targetChild, parent, {
        academicYearId: targetAcademicYearId,
        subjectId,
        gradeType,
        startDate,
        endDate,
        timeFilter,
        classAverages,
        includeClassAverage,
      });
    }

    // Calculate summary statistics
    const gradeValues = grades.map(g => g.value);
    const examMarks = examResults.map(r => (r.marksObtained / r.exam.totalMarks) * 100);
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
      failedExams: examResults.filter(r => r.status === "FAIL"),
      gradesByType: getGradesByType(grades),
      recentGrades: grades.slice(0, 5),
      recentExams: examResults.slice(0, 3),
    };

    // Calculate per-subject statistics
    const subjectStats = subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subjectId === subject.id);
      const subjectExams = examResults.filter(r => r.exam.subjectId === subject.id);
      const subjectGradeValues = subjectGrades.map(g => g.value);
      const subjectExamMarks = subjectExams.map(r => (r.marksObtained / r.exam.totalMarks) * 100);
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
        failedExams: subjectExams.filter(r => r.status === "FAIL"),
        classAverage: classAverages[subject.id] || null,
      };
    });

    // Generate insights and alerts
    const insights = generateParentInsights(summary, subjectStats, targetChild, classAverages);

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
      grades,
      examResults,
      summary,
      subjectStats,
      insights,
      availableAcademicYears,
      subjects,
      currentAcademicYear: availableAcademicYears.find(ay => ay.id === targetAcademicYearId),
      timeFilter,
      view,
      classAverages,
    });

  } catch (error) {
    console.error("Error fetching parent gradebook:", error);
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

async function getClassAverages(classId: number, academicYearId: number, subjectId?: string) {
  const where: any = {
    classId,
    academicYearId,
    status: "ACTIVE",
  };

  if (subjectId) where.subjectId = parseInt(subjectId);

  const classGrades = await prisma.grade.findMany({
    where,
    include: {
      subject: true,
    },
  });

  const classExamResults = await prisma.examResult.findMany({
    where: {
      exam: {
        classId,
        academicYearId,
        status: "ACTIVE",
        ...(subjectId && { subjectId: parseInt(subjectId) }),
      },
    },
    include: {
      exam: {
        include: {
          subject: true,
        },
      },
    },
  });

  const averages: Record<number, { gradeAverage: number; examAverage: number; overallAverage: number }> = {};

  // Calculate by subject
  const subjects = [...new Set([
    ...classGrades.map(g => g.subject),
    ...classExamResults.map(r => r.exam.subject),
  ])];

  subjects.forEach(subject => {
    const subjectGrades = classGrades.filter(g => g.subjectId === subject.id);
    const subjectExams = classExamResults.filter(r => r.exam.subjectId === subject.id);
    
    const gradeValues = subjectGrades.map(g => g.value);
    const examScores = subjectExams.map(r => (r.marksObtained / r.exam.totalMarks) * 100);
    
    const gradeAverage = gradeValues.length > 0 ? 
      Math.round((gradeValues.reduce((sum, v) => sum + v, 0) / gradeValues.length) * 100) / 100 : 0;
    const examAverage = examScores.length > 0 ? 
      Math.round((examScores.reduce((sum, v) => sum + v, 0) / examScores.length) * 100) / 100 : 0;
    const overallAverage = [...gradeValues, ...examScores].length > 0 ? 
      Math.round(([...gradeValues, ...examScores].reduce((sum, v) => sum + v, 0) / [...gradeValues, ...examScores].length) * 100) / 100 : 0;

    averages[subject.id] = {
      gradeAverage,
      examAverage,
      overallAverage,
    };
  });

  return averages;
}

function generateParentInsights(summary: any, subjectStats: any[], child: any, classAverages: any) {
  const insights = [];
  const alerts = [];

  // Performance insights
  if (summary.overallAverage >= 90) {
    insights.push({
      type: "success",
      title: "Outstanding Performance!",
      message: `${child.firstName} is achieving excellent results with an overall average of ${summary.overallAverage}%. Keep up the great work!`,
      icon: "🌟",
    });
  } else if (summary.overallAverage >= 70) {
    insights.push({
      type: "success",
      title: "Good Academic Progress",
      message: `${child.firstName} is performing well with an overall average of ${summary.overallAverage}%. Encourage continued effort!`,
      icon: "👍",
    });
  } else if (summary.overallAverage >= 50) {
    insights.push({
      type: "warning",
      title: "Room for Improvement",
      message: `${child.firstName}'s overall average is ${summary.overallAverage}%. Consider additional study support.`,
      icon: "📚",
    });
  } else if (summary.overallAverage > 0) {
    alerts.push({
      type: "danger",
      title: "Academic Support Needed",
      message: `${child.firstName}'s overall average is ${summary.overallAverage}%. Please consider meeting with teachers for support strategies.`,
      icon: "⚠️",
      actionable: true,
    });
  }

  // Failed exams alert
  if (summary.failedExams.length > 0) {
    alerts.push({
      type: "warning",
      title: "Failed Exams Need Attention",
      message: `${child.firstName} has ${summary.failedExams.length} failed exam${summary.failedExams.length > 1 ? 's' : ''}. Review with teachers for improvement strategies.`,
      icon: "📝",
      actionable: true,
      details: summary.failedExams.map((exam: any) => ({
        subject: exam.exam.subject.name,
        title: exam.exam.title,
        score: `${exam.marksObtained}/${exam.exam.totalMarks}`,
        date: exam.exam.date,
      })),
    });
  }

  // Subject-specific insights
  const weakSubjects = subjectStats.filter(s => s.overallAverage < 50 && s.totalGrades + s.totalExams >= 3);
  if (weakSubjects.length > 0) {
    alerts.push({
      type: "warning",
      title: "Subjects Requiring Focus",
      message: `${child.firstName} is struggling in: ${weakSubjects.map(s => s.subject.name).join(", ")}. Consider additional tutoring or study time.`,
      icon: "📖",
      actionable: true,
    });
  }

  // Strong subjects recognition
  const strongSubjects = subjectStats.filter(s => s.overallAverage >= 85);
  if (strongSubjects.length > 0) {
    insights.push({
      type: "success",
      title: "Academic Strengths",
      message: `${child.firstName} excels in: ${strongSubjects.map(s => s.subject.name).join(", ")}. These can be leveraged to build confidence!`,
      icon: "🏆",
    });
  }

  // Class comparison insights
  const belowClassAverage = subjectStats.filter(s => s.classAverage && s.overallAverage < s.classAverage.overallAverage - 10);
  if (belowClassAverage.length > 0) {
    alerts.push({
      type: "info",
      title: "Below Class Average",
      message: `${child.firstName} is below class average in: ${belowClassAverage.map(s => s.subject.name).join(", ")}. Consider discussing with teachers.`,
      icon: "📊",
      actionable: true,
    });
  }

  const aboveClassAverage = subjectStats.filter(s => s.classAverage && s.overallAverage > s.classAverage.overallAverage + 10);
  if (aboveClassAverage.length > 0) {
    insights.push({
      type: "success",
      title: "Above Class Average",
      message: `${child.firstName} is performing above class average in: ${aboveClassAverage.map(s => s.subject.name).join(", ")}. Excellent work!`,
      icon: "📈",
    });
  }

  // Exam performance insights
  if (summary.examPassRate === 100 && summary.totalExams > 0) {
    insights.push({
      type: "success",
      title: "Perfect Exam Record",
      message: `${child.firstName} has passed all ${summary.totalExams} exams. Outstanding achievement!`,
      icon: "🎯",
    });
  } else if (summary.examPassRate < 70 && summary.totalExams > 0) {
    alerts.push({
      type: "warning",
      title: "Exam Performance Concern",
      message: `${child.firstName}'s exam pass rate is ${summary.examPassRate}%. Focus on exam preparation strategies.`,
      icon: "📋",
      actionable: true,
    });
  }

  return {
    insights,
    alerts,
    summary: {
      totalInsights: insights.length,
      totalAlerts: alerts.length,
      actionableAlerts: alerts.filter(a => a.actionable).length,
    },
  };
}

async function getChildrenComparison(parent: any, filters: any) {
  // Implementation for comparing multiple children's performance
  const comparisonData = await Promise.all(
    parent.students.map(async (child: any) => {
      // Get grades and exam results for each child
      const gradeWhere: any = {
        studentId: child.id,
        status: "ACTIVE",
      };

      if (filters.academicYearId) gradeWhere.academicYearId = parseInt(filters.academicYearId);
      if (filters.subjectId) gradeWhere.subjectId = parseInt(filters.subjectId);
      if (filters.gradeType) gradeWhere.type = filters.gradeType;

      const grades = await prisma.grade.findMany({
        where: gradeWhere,
        include: {
          subject: true,
        },
      });

      const examResults = await prisma.examResult.findMany({
        where: {
          studentId: child.id,
          exam: {
            status: "ACTIVE",
            ...(filters.academicYearId && { academicYearId: parseInt(filters.academicYearId) }),
            ...(filters.subjectId && { subjectId: parseInt(filters.subjectId) }),
          },
        },
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
        },
      });

      const gradeValues = grades.map(g => g.value);
      const examMarks = examResults.map(r => (r.marksObtained / r.exam.totalMarks) * 100);
      const allScores = [...gradeValues, ...examMarks];

      return {
        child: {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentId: child.studentId,
          class: child.class,
        },
        summary: {
          totalGrades: grades.length,
          totalExams: examResults.length,
          overallAverage: allScores.length > 0 ? 
            Math.round((allScores.reduce((sum, v) => sum + v, 0) / allScores.length) * 100) / 100 : 0,
          examPassRate: examResults.length > 0 ? 
            Math.round((examResults.filter(r => r.status === "PASS").length / examResults.length) * 100) : 0,
          highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
          lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
        },
      };
    })
  );

  return NextResponse.json({
    parent: {
      id: parent.id,
      firstName: parent.firstName,
      lastName: parent.lastName,
    },
    comparison: true,
    childrenData: comparisonData,
    filters,
  });
}

async function getParentAnalytics(grades: any[], examResults: any[], child: any, parent: any, filters: any) {
  // Implementation for detailed analytics view
  // This would include trend analysis, performance charts, etc.
  // Similar to student analytics but formatted for parent viewing
  
  return NextResponse.json({
    parent: {
      id: parent.id,
      firstName: parent.firstName,
      lastName: parent.lastName,
    },
    child: {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      studentId: child.studentId,
      class: child.class,
    },
    analytics: {
      // Analytics data would go here
    },
    filters,
  });
}
