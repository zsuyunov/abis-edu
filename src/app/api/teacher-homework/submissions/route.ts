import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { homeworkFeedbackSchema, bulkHomeworkFeedbackSchema } from "@/lib/formValidationSchemas";

export async function GET(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const teacherId = request.headers.get('x-user-id');
    let authenticatedUserId = teacherId;

    if (!teacherId) {
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
    const requestedTeacherId = url.searchParams.get("teacherId") || authenticatedUserId;
    const homeworkId = url.searchParams.get("homeworkId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const status = url.searchParams.get("status") || "ALL";
    const view = url.searchParams.get("view") || "list"; // list, individual, analytics

    // Verify teacher can only access their own homework submissions
    if (authenticatedUserId !== requestedTeacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information
    const teacher = await prisma.teacher.findUnique({
      where: { id: requestedTeacherId || undefined },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get teacher assignments to determine branch access
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: requestedTeacherId || undefined,
        status: "ACTIVE",
      },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ error: "No assignments found for teacher" }, { status: 404 });
    }

    const teacherBranchIds = Array.from(new Set(teacherAssignments.map(a => a.branchId)));

    // Build filter conditions with branch restriction
    const submissionWhere: any = {
      homework: {
        teacherId: requestedTeacherId,
        branchId: { in: teacherBranchIds },
      },
    };

    if (homeworkId) submissionWhere.homeworkId = parseInt(homeworkId);
    if (status !== "ALL") submissionWhere.status = status;

    // Add additional filters
    if (classId) {
      submissionWhere.homework.classId = parseInt(classId);
    }
    if (subjectId) {
      submissionWhere.homework.subjectId = parseInt(subjectId);
    }

    // Get submissions with related data
    const submissions = await prisma.homeworkSubmission.findMany({
      where: submissionWhere,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        homework: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            totalPoints: true,
            allowLateSubmission: true,
            latePenalty: true,
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
      },
      orderBy: [
        { homework: { dueDate: "desc" } },
        { student: { firstName: "asc" } },
      ],
    });

    // Calculate submission statistics
    const stats = calculateSubmissionStats(submissions);

    if (view === "individual" && homeworkId && requestedTeacherId) {
      return getIndividualHomeworkSubmissions(parseInt(homeworkId), requestedTeacherId, teacherBranchIds[0]);
    }

    if (view === "analytics") {
      return getSubmissionAnalytics(submissions, teacher, {
        homeworkId,
        classId,
        subjectId,
        status,
      });
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        teacherId: teacher.teacherId,
        email: teacher.email,
      },
      submissions,
      stats,
      filters: {
        homeworkId,
        classId,
        subjectId,
        status,
      },
    });

  } catch (error) {
    console.error("Error fetching homework submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission data" },
      { status: 500 }
    );
  }
}

async function putHandler(request: NextRequest) {
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

    const body = await request.json();
    const { bulk = false, ...data } = body;

    if (bulk) {
      // Handle bulk feedback
      const validatedData = bulkHomeworkFeedbackSchema.parse({
        ...data,
        teacherId: session.id,
      });

      // Verify homework belongs to teacher
      const homework = await prisma.homework.findUnique({
        where: { id: validatedData.homeworkId },
        include: { teacher: true },
      });

      if (!homework) {
        return NextResponse.json({ error: "Homework not found" }, { status: 404 });
      }

      if (homework.teacherId !== session.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Update all submissions
      const updatePromises = validatedData.feedbacks.map(feedback => {
        const updateData: any = {
          status: feedback.status,
          feedback: feedback.feedback,
        };

        if (feedback.grade !== undefined) {
          updateData.grade = feedback.grade;
        }

        return prisma.homeworkSubmission.update({
          where: { id: feedback.submissionId },
          data: updateData,
        });
      });

      await Promise.all(updatePromises);

      return NextResponse.json({
        success: true,
        message: `Updated feedback for ${validatedData.feedbacks.length} submissions`,
      });

    } else {
      // Handle single feedback
      const validatedData = homeworkFeedbackSchema.parse({
        ...data,
        teacherId: session.id,
      });

      // Verify submission exists and belongs to teacher's homework
      const submission = await prisma.homeworkSubmission.findUnique({
        where: { id: validatedData.submissionId },
        include: {
          homework: {
            include: { teacher: true },
          },
        },
      });

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      if (submission.homework.teacherId !== session.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Update submission
      const updateData: any = {
        status: validatedData.status,
        feedback: validatedData.feedback,
      };

      if (validatedData.grade !== undefined) {
        updateData.grade = validatedData.grade;
      }

      const updatedSubmission = await prisma.homeworkSubmission.update({
        where: { id: validatedData.submissionId },
        data: updateData,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
          homework: {
            select: {
              id: true,
              title: true,
              subject: { select: { name: true } },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        submission: updatedSubmission,
        message: "Feedback updated successfully",
      });
    }

  } catch (error) {
    console.error("Error updating homework feedback:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

export const PUT = withCSRF(putHandler);

// Helper functions
function calculateSubmissionStats(submissions: any[]) {
  const totalSubmissions = submissions.length;
  const submittedCount = submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length;
  const lateCount = submissions.filter(s => s.isLate).length;
  const notSubmittedCount = submissions.filter(s => s.status === "NOT_SUBMITTED").length;
  const gradedCount = submissions.filter(s => s.status === "GRADED").length;

  const submissionRate = totalSubmissions > 0 ? Math.round((submittedCount / totalSubmissions) * 100) : 0;
  const onTimeRate = submittedCount > 0 ? Math.round(((submittedCount - lateCount) / submittedCount) * 100) : 0;
  const gradingProgress = submittedCount > 0 ? Math.round((gradedCount / submittedCount) * 100) : 0;

  return {
    totalSubmissions,
    submittedCount,
    lateCount,
    notSubmittedCount,
    gradedCount,
    submissionRate,
    onTimeRate,
    gradingProgress,
  };
}

async function getIndividualHomeworkSubmissions(homeworkId: number, teacherId: string, branchId: number) {
  try {
    // Get homework details
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        subject: true,
        class: {
          include: {
            students: {
              where: {
                status: "ACTIVE",
                branchId: branchId, // Ensure students are from correct branch
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
        academicYear: true,
        branch: true,
        attachments: true,
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (homework.teacherId !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get actual student count from class
    const actualStudentCount = await prisma.student.count({
      where: {
        classId: homework.classId,
        branchId: branchId,
        status: "ACTIVE",
      },
    });

    // Get all submissions for this homework
    const submissions = await prisma.homeworkSubmission.findMany({
      where: { 
        homeworkId,
        student: {
          branchId: branchId, // Ensure submissions are from correct branch
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        attachments: true,
      },
      orderBy: [
        { status: "asc" },
        { student: { firstName: "asc" } },
      ],
    });

    // Create submission map for quick lookup
    const submissionMap = new Map();
    submissions.forEach(sub => {
      submissionMap.set(sub.studentId, sub);
    });

    // Create complete student list with submission status
    const studentsWithSubmissions = homework.class.students.map(student => {
      const submission = submissionMap.get(student.id);
      return {
        ...student,
        submission: submission || {
          id: null,
          homeworkId,
          studentId: student.id,
          status: "NOT_SUBMITTED",
          submissionDate: null,
          content: null,
          grade: null,
          feedback: null,
          isLate: false,
          attachments: [],
          createdAt: null,
          updatedAt: null,
        },
      };
    });

    // Calculate detailed statistics with actual student count
    const stats = calculateSubmissionStats(submissions);
    const detailedStats = {
      ...stats,
      totalStudents: actualStudentCount,
      missingSubmissions: actualStudentCount - submissions.length,
      submissionRate: actualStudentCount > 0 ? Math.round((submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length / actualStudentCount) * 100) : 0,
    };

    return NextResponse.json({
      homework,
      studentsWithSubmissions,
      stats: detailedStats,
    });

  } catch (error) {
    console.error("Error fetching individual homework submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework submissions" },
      { status: 500 }
    );
  }
}

async function getSubmissionAnalytics(submissions: any[], teacher: any, filters: any) {
  const analytics = {
    submissionStats: calculateSubmissionStats(submissions),
    gradeDistribution: calculateGradeDistribution(submissions),
    submissionTrends: calculateSubmissionTrends(submissions),
    studentPerformance: calculateStudentPerformance(submissions),
    insights: generateSubmissionInsights(submissions),
  };

  return NextResponse.json({
    teacher,
    analytics,
    filters,
  });
}

function calculateGradeDistribution(submissions: any[]) {
  const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
  
  if (gradedSubmissions.length === 0) {
    return {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      fair: 0,      // 50-69
      poor: 0,      // 0-49
      averageGrade: 0,
      totalGraded: 0,
    };
  }

  const excellent = gradedSubmissions.filter(s => s.grade >= 90).length;
  const good = gradedSubmissions.filter(s => s.grade >= 70 && s.grade < 90).length;
  const fair = gradedSubmissions.filter(s => s.grade >= 50 && s.grade < 70).length;
  const poor = gradedSubmissions.filter(s => s.grade < 50).length;

  const totalGrades = gradedSubmissions.reduce((sum, s) => sum + s.grade, 0);
  const averageGrade = Math.round(totalGrades / gradedSubmissions.length);

  return {
    excellent,
    good,
    fair,
    poor,
    averageGrade,
    totalGraded: gradedSubmissions.length,
  };
}

function calculateSubmissionTrends(submissions: any[]) {
  const trends: Record<string, any> = {};

  submissions.forEach(submission => {
    if (submission.submissionDate) {
      const dateKey = new Date(submission.submissionDate).toISOString().split('T')[0];
      
      if (!trends[dateKey]) {
        trends[dateKey] = {
          date: dateKey,
          totalSubmissions: 0,
          onTimeSubmissions: 0,
          lateSubmissions: 0,
        };
      }

      trends[dateKey].totalSubmissions++;
      if (submission.isLate) {
        trends[dateKey].lateSubmissions++;
      } else {
        trends[dateKey].onTimeSubmissions++;
      }
    }
  });

  return Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date));
}

function calculateStudentPerformance(submissions: any[]) {
  const studentPerformance: Record<string, any> = {};

  submissions.forEach(submission => {
    const studentId = submission.student.id;
    const studentName = `${submission.student.firstName} ${submission.student.lastName}`;
    
    if (!studentPerformance[studentId]) {
      studentPerformance[studentId] = {
        student: {
          id: studentId,
          name: studentName,
          studentId: submission.student.studentId,
        },
        totalSubmissions: 0,
        submittedCount: 0,
        averageGrade: 0,
        onTimeSubmissions: 0,
        lateSubmissions: 0,
      };
    }

    const perf = studentPerformance[studentId];
    perf.totalSubmissions++;
    
    if (submission.status === "SUBMITTED" || submission.status === "GRADED") {
      perf.submittedCount++;
      
      if (submission.isLate) {
        perf.lateSubmissions++;
      } else {
        perf.onTimeSubmissions++;
      }
    }

    if (submission.grade !== null && submission.grade !== undefined) {
      perf.averageGrade = submission.grade; // For single homework, just use the grade
    }
  });

  return Object.values(studentPerformance)
    .sort((a: any, b: any) => b.averageGrade - a.averageGrade);
}

function generateSubmissionInsights(submissions: any[]) {
  const insights: string[] = [];

  if (submissions.length === 0) {
    insights.push("📚 No submissions found for the selected criteria.");
    return insights;
  }

  const stats = calculateSubmissionStats(submissions);
  const gradeDistribution = calculateGradeDistribution(submissions);

  // Submission rate insights
  if (stats.submissionRate >= 90) {
    insights.push("🌟 Excellent submission rate! Students are engaged with the homework.");
  } else if (stats.submissionRate >= 75) {
    insights.push("👍 Good submission rate. Consider reminders for missing students.");
  } else {
    insights.push("📈 Low submission rate. Review homework difficulty and provide additional support.");
  }

  // Punctuality insights
  if (stats.onTimeRate >= 90) {
    insights.push("⏰ Great! Most students are submitting on time.");
  } else if (stats.onTimeRate < 70) {
    insights.push("⏰ Many late submissions. Consider adjusting deadlines or providing reminders.");
  }

  // Grade insights
  if (gradeDistribution.totalGraded > 0) {
    if (gradeDistribution.averageGrade >= 85) {
      insights.push("📊 Strong performance! Average grade is excellent.");
    } else if (gradeDistribution.averageGrade >= 70) {
      insights.push("📊 Good performance overall. Some students may need additional support.");
    } else {
      insights.push("📊 Consider reviewing the homework material with students for better understanding.");
    }
  }

  // Grading progress insights
  if (stats.gradingProgress < 50) {
    insights.push("✏️ Prioritize grading to provide timely feedback to students.");
  } else if (stats.gradingProgress >= 90) {
    insights.push("✅ Excellent job staying current with grading!");
  }

  return insights;
}
