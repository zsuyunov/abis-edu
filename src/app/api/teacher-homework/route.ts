import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { homeworkSchema, homeworkFilterSchema } from "@/lib/formValidationSchemas";

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
    const teacherId = url.searchParams.get("teacherId") || session.id;
    const branchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const status = url.searchParams.get("status") || "ALL";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const view = url.searchParams.get("view") || "list"; // list, analytics, export

    // Verify teacher can only access their own homework
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information with branch details
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        branch: true,
        subjects: true,
        classes: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get teacher's branch for filtering
    const teacherBranchId = teacher.branchId;

    // Validate requested branch matches teacher's branch
    if (branchId && parseInt(branchId) !== teacherBranchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Get available academic years for the teacher (scoped by branch)
    const availableAcademicYears = await prisma.academicYear.findMany({
      where: {
        classes: {
          some: {
            branchId: teacherBranchId,
            teachers: {
              some: { id: teacherId },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Get teacher's assigned classes (scoped by branch)
    const assignedClasses = await prisma.class.findMany({
      where: {
        branchId: teacherBranchId,
        teachers: {
          some: { id: teacherId },
        },
      },
      include: {
        academicYear: true,
        branch: true,
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get teacher's assigned subjects (scoped by branch)
    const assignedSubjects = await prisma.subject.findMany({
      where: {
        teachers: {
          some: { id: teacherId },
        },
        classes: {
          some: {
            branchId: teacherBranchId,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Build filter conditions for homework with branch restriction
    const homeworkWhere: any = {
      teacherId,
      branchId: teacherBranchId, // Always filter by teacher's branch
    };

    if (academicYearId) homeworkWhere.academicYearId = parseInt(academicYearId);
    if (classId) homeworkWhere.classId = parseInt(classId);
    if (subjectId) homeworkWhere.subjectId = parseInt(subjectId);
    if (status !== "ALL") homeworkWhere.status = status;

    if (startDate && endDate) {
      homeworkWhere.assignedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get homework records with related data and submission counts
    const homework = await prisma.homework.findMany({
      where: homeworkWhere,
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
            capacity: true,
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
          select: {
            id: true,
            status: true,
            submissionDate: true,
            isLate: true,
            grade: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [
        { assignedDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Calculate submission statistics for each homework
    const homeworkWithStats = homework.map(hw => {
      const totalStudents = hw.class.capacity; // or count actual enrolled students
      const submissions = hw.submissions;
      const submittedCount = submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length;
      const lateCount = submissions.filter(s => s.isLate).length;
      const notSubmittedCount = totalStudents - submittedCount;
      const gradedCount = submissions.filter(s => s.status === "GRADED").length;
      
      const submissionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
      const onTimeRate = submittedCount > 0 ? Math.round(((submittedCount - lateCount) / submittedCount) * 100) : 0;
      const gradingProgress = submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0;

      return {
        ...hw,
        stats: {
          totalStudents,
          submittedCount,
          lateCount,
          notSubmittedCount,
          gradedCount,
          submissionRate,
          onTimeRate,
          gradingProgress,
        },
      };
    });

    if (view === "analytics") {
      return getTeacherHomeworkAnalytics(homeworkWithStats, teacher, {
        academicYearId,
        classId,
        subjectId,
        startDate,
        endDate,
      });
    }

    // Calculate overall statistics
    const overallStats = calculateOverallStats(homeworkWithStats);

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        teacherId: teacher.teacherId,
        branch: teacher.branch,
      },
      homework: homeworkWithStats,
      overallStats,
      availableAcademicYears,
      assignedClasses,
      assignedSubjects,
      filters: {
        academicYearId,
        classId,
        subjectId,
        status,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error("Error fetching teacher homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate the homework data
    const validatedData = homeworkSchema.parse({
      ...body,
      teacherId: session.id,
    });

    // Verify teacher can only create homework for their assigned subjects and classes
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id },
      include: {
        subjects: true,
        classes: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Verify branch access
    if (validatedData.branchId !== teacher.branchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Verify subject assignment
    const isAssignedToSubject = teacher.subjects.some(s => s.id === validatedData.subjectId);
    if (!isAssignedToSubject) {
      return NextResponse.json({ error: "Not assigned to this subject" }, { status: 403 });
    }

    // Verify class assignment
    const isAssignedToClass = teacher.classes.some(c => c.id === validatedData.classId);
    if (!isAssignedToClass) {
      return NextResponse.json({ error: "Not assigned to this class" }, { status: 403 });
    }

    // Create homework
    const homework = await prisma.homework.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        assignedDate: validatedData.assignedDate,
        dueDate: validatedData.dueDate,
        status: validatedData.status,
        totalPoints: validatedData.totalPoints,
        passingGrade: validatedData.passingGrade,
        allowLateSubmission: validatedData.allowLateSubmission,
        latePenalty: validatedData.latePenalty,
        branchId: validatedData.branchId,
        academicYearId: validatedData.academicYearId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        teacherId: validatedData.teacherId,
      },
      include: {
        subject: true,
        class: true,
        academicYear: true,
        branch: true,
      },
    });

    // Create homework attachments if provided
    if (validatedData.attachments && validatedData.attachments.length > 0) {
      await prisma.homeworkAttachment.createMany({
        data: validatedData.attachments.map(attachment => ({
          ...attachment,
          homeworkId: homework.id,
        })),
      });
    }

    // Create submission records for all students in the class
    const studentsInClass = await prisma.student.findMany({
      where: {
        classId: validatedData.classId,
        branchId: validatedData.branchId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (studentsInClass.length > 0) {
      await prisma.homeworkSubmission.createMany({
        data: studentsInClass.map(student => ({
          homeworkId: homework.id,
          studentId: student.id,
          status: "NOT_SUBMITTED",
        })),
      });
    }

    return NextResponse.json({
      success: true,
      homework,
      message: `Homework "${homework.title}" created successfully for ${studentsInClass.length} students`,
    });

  } catch (error) {
    console.error("Error creating homework:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create homework" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Validate the homework data
    const validatedData = homeworkSchema.parse({
      ...updateData,
      teacherId: session.id,
    });

    // Verify homework exists and belongs to teacher
    const existingHomework = await prisma.homework.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: true,
      },
    });

    if (!existingHomework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (existingHomework.teacherId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update homework
    const updatedHomework = await prisma.homework.update({
      where: { id: parseInt(id) },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        assignedDate: validatedData.assignedDate,
        dueDate: validatedData.dueDate,
        status: validatedData.status,
        totalPoints: validatedData.totalPoints,
        passingGrade: validatedData.passingGrade,
        allowLateSubmission: validatedData.allowLateSubmission,
        latePenalty: validatedData.latePenalty,
      },
      include: {
        subject: true,
        class: true,
        academicYear: true,
        branch: true,
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      homework: updatedHomework,
      message: "Homework updated successfully",
    });

  } catch (error) {
    console.error("Error updating homework:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update homework" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Verify homework exists and belongs to teacher
    const homework = await prisma.homework.findUnique({
      where: { id: parseInt(id) },
      include: {
        submissions: {
          where: {
            status: {
              in: ["SUBMITTED", "GRADED"],
            },
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (homework.teacherId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if homework has submissions
    if (homework.submissions.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete homework with existing submissions. Archive it instead." 
      }, { status: 400 });
    }

    // Delete homework (cascading deletes will handle attachments and submissions)
    await prisma.homework.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Homework deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting homework:", error);
    return NextResponse.json(
      { error: "Failed to delete homework" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOverallStats(homework: any[]) {
  if (homework.length === 0) {
    return {
      totalHomework: 0,
      totalSubmissions: 0,
      averageSubmissionRate: 0,
      averageOnTimeRate: 0,
      averageGradingProgress: 0,
      upcomingDeadlines: 0,
      overdueCount: 0,
    };
  }

  const totalHomework = homework.length;
  const totalSubmissions = homework.reduce((sum, hw) => sum + hw.stats.submittedCount, 0);
  const averageSubmissionRate = Math.round(
    homework.reduce((sum, hw) => sum + hw.stats.submissionRate, 0) / totalHomework
  );
  const averageOnTimeRate = Math.round(
    homework.reduce((sum, hw) => sum + hw.stats.onTimeRate, 0) / totalHomework
  );
  const averageGradingProgress = Math.round(
    homework.reduce((sum, hw) => sum + hw.stats.gradingProgress, 0) / totalHomework
  );

  const today = new Date();
  const upcomingDeadlines = homework.filter(hw => 
    new Date(hw.dueDate) > today && new Date(hw.dueDate) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  const overdueCount = homework.filter(hw => 
    new Date(hw.dueDate) < today && hw.status === "ACTIVE"
  ).length;

  return {
    totalHomework,
    totalSubmissions,
    averageSubmissionRate,
    averageOnTimeRate,
    averageGradingProgress,
    upcomingDeadlines,
    overdueCount,
  };
}

async function getTeacherHomeworkAnalytics(homework: any[], teacher: any, filters: any) {
  const analytics = {
    overallStats: calculateOverallStats(homework),
    submissionTrends: calculateSubmissionTrends(homework),
    subjectPerformance: calculateSubjectPerformance(homework),
    classPerformance: calculateClassPerformance(homework),
    deadlineAnalysis: calculateDeadlineAnalysis(homework),
    insights: generateTeacherInsights(homework),
  };

  return NextResponse.json({
    teacher,
    analytics,
    filters,
  });
}

function calculateSubmissionTrends(homework: any[]) {
  const trends: Record<string, any> = {};

  homework.forEach(hw => {
    const weekKey = getWeekKey(new Date(hw.assignedDate));
    
    if (!trends[weekKey]) {
      trends[weekKey] = {
        week: weekKey,
        totalHomework: 0,
        totalSubmissions: 0,
        averageSubmissionRate: 0,
      };
    }

    trends[weekKey].totalHomework++;
    trends[weekKey].totalSubmissions += hw.stats.submittedCount;
  });

  // Calculate averages
  return Object.values(trends)
    .map((trend: any) => ({
      ...trend,
      averageSubmissionRate: trend.totalHomework > 0 ? 
        Math.round((trend.totalSubmissions / (trend.totalHomework * 100)) * 100) : 0,
    }))
    .sort((a: any, b: any) => a.week.localeCompare(b.week));
}

function calculateSubjectPerformance(homework: any[]) {
  const subjectPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const subjectId = hw.subjectId;
    const subjectName = hw.subject.name;
    
    if (!subjectPerformance[subjectId]) {
      subjectPerformance[subjectId] = {
        subject: { id: subjectId, name: subjectName },
        totalHomework: 0,
        totalSubmissions: 0,
        averageSubmissionRate: 0,
        averageOnTimeRate: 0,
      };
    }

    subjectPerformance[subjectId].totalHomework++;
    subjectPerformance[subjectId].totalSubmissions += hw.stats.submittedCount;
  });

  // Calculate averages
  return Object.values(subjectPerformance)
    .map((perf: any) => ({
      ...perf,
      averageSubmissionRate: perf.totalHomework > 0 ? 
        Math.round((perf.totalSubmissions / (perf.totalHomework * 100)) * 100) : 0,
    }))
    .sort((a: any, b: any) => b.averageSubmissionRate - a.averageSubmissionRate);
}

function calculateClassPerformance(homework: any[]) {
  const classPerformance: Record<string, any> = {};

  homework.forEach(hw => {
    const classId = hw.classId;
    const className = hw.class.name;
    
    if (!classPerformance[classId]) {
      classPerformance[classId] = {
        class: { id: classId, name: className },
        totalHomework: 0,
        totalSubmissions: 0,
        averageSubmissionRate: 0,
      };
    }

    classPerformance[classId].totalHomework++;
    classPerformance[classId].totalSubmissions += hw.stats.submittedCount;
  });

  // Calculate averages
  return Object.values(classPerformance)
    .map((perf: any) => ({
      ...perf,
      averageSubmissionRate: perf.totalHomework > 0 ? 
        Math.round((perf.totalSubmissions / (perf.totalHomework * 100)) * 100) : 0,
    }))
    .sort((a: any, b: any) => b.averageSubmissionRate - a.averageSubmissionRate);
}

function calculateDeadlineAnalysis(homework: any[]) {
  const today = new Date();
  const upcomingWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcoming = homework.filter(hw => 
    new Date(hw.dueDate) > today && new Date(hw.dueDate) <= upcomingWeek
  );
  
  const overdue = homework.filter(hw => 
    new Date(hw.dueDate) < today && hw.status === "ACTIVE"
  );

  return {
    upcomingDeadlines: upcoming.length,
    overdueHomework: overdue.length,
    upcomingList: upcoming.map(hw => ({
      id: hw.id,
      title: hw.title,
      dueDate: hw.dueDate,
      subject: hw.subject.name,
      class: hw.class.name,
      submissionRate: hw.stats.submissionRate,
    })),
    overdueList: overdue.map(hw => ({
      id: hw.id,
      title: hw.title,
      dueDate: hw.dueDate,
      subject: hw.subject.name,
      class: hw.class.name,
      submissionRate: hw.stats.submissionRate,
    })),
  };
}

function generateTeacherInsights(homework: any[]) {
  const insights: string[] = [];

  if (homework.length === 0) {
    insights.push("📚 Start by creating your first homework assignment!");
    return insights;
  }

  const overallStats = calculateOverallStats(homework);

  // Submission rate insights
  if (overallStats.averageSubmissionRate >= 90) {
    insights.push("🌟 Excellent! Your homework has high submission rates.");
  } else if (overallStats.averageSubmissionRate >= 75) {
    insights.push("👍 Good submission rates. Consider strategies to reach 90%+.");
  } else {
    insights.push("📈 Focus on improving submission rates. Try shorter assignments or clearer instructions.");
  }

  // Grading insights
  if (overallStats.averageGradingProgress < 50) {
    insights.push("⏰ Consider prioritizing grading to provide timely feedback to students.");
  } else if (overallStats.averageGradingProgress >= 90) {
    insights.push("✅ Great job staying on top of grading!");
  }

  // Deadline insights
  if (overallStats.overdueCount > 0) {
    insights.push(`📅 You have ${overallStats.overdueCount} overdue homework assignments. Consider extending deadlines or archiving completed work.`);
  }

  if (overallStats.upcomingDeadlines > 3) {
    insights.push("📆 You have several upcoming deadlines. Plan your grading schedule accordingly.");
  }

  return insights;
}

function getWeekKey(date: Date) {
  const year = date.getFullYear();
  const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
