import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const academicYearId = searchParams.get("academicYearId");
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    if (!classId || !subjectId) {
      return NextResponse.json(
        { error: "Class and Subject are required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      status: { not: "CANCELLED" },
    };
    
    if (branchId && branchId !== "all") {
      whereClause.branchId = parseInt(branchId);
    }
    if (academicYearId && academicYearId !== "all") {
      whereClause.academicYearId = parseInt(academicYearId);
    }
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = { gte: new Date(startDate) };
    } else if (endDate) {
      whereClause.date = { lte: new Date(endDate) };
    }

    // Get all exams for the class and subject with results
    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherId: true,
          },
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
        examResults: {
          include: {
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
      },
      orderBy: [
        { date: "desc" },
        { startTime: "asc" },
      ],
    });

    // Get all students in the class for complete analysis
    const allStudents = await prisma.student.findMany({
      where: {
        classId: parseInt(classId),
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    // Process exam statistics
    const examStatistics = exams.map(exam => {
      const results = exam.examResults;
      const validResults = results.filter(r => r.marksObtained > 0);
      
      const totalMarks = validResults.reduce((sum, r) => sum + r.marksObtained, 0);
      const averageScore = validResults.length > 0 ? Math.round((totalMarks / validResults.length) * 100) / 100 : 0;
      
      const passCount = results.filter(r => r.status === "PASS").length;
      const failCount = results.filter(r => r.status === "FAIL").length;
      const totalSubmissions = passCount + failCount;
      
      const passPercentage = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 100) : 0;
      const failPercentage = totalSubmissions > 0 ? Math.round((failCount / totalSubmissions) * 100) : 0;
      
      const marks = validResults.map(r => r.marksObtained);
      const highestScore = marks.length > 0 ? Math.max(...marks) : 0;
      const lowestScore = marks.length > 0 ? Math.min(...marks) : 0;
      
      // Top and bottom performers
      const sortedResults = results
        .filter(r => r.marksObtained > 0)
        .sort((a, b) => b.marksObtained - a.marksObtained);
      
      const topPerformers = sortedResults.slice(0, 5).map(r => ({
        student: r.student,
        marksObtained: r.marksObtained,
        status: r.status,
      }));
      
      const bottomPerformers = sortedResults.slice(-5).reverse().map(r => ({
        student: r.student,
        marksObtained: r.marksObtained,
        status: r.status,
      }));

      return {
        ...exam,
        statistics: {
          totalStudents: results.length,
          submissionsCount: totalSubmissions,
          averageScore,
          highestScore,
          lowestScore,
          passCount,
          failCount,
          passPercentage,
          failPercentage,
          topPerformers,
          bottomPerformers,
        },
      };
    });

    // Calculate student-level performance across all exams
    const studentPerformance = allStudents.map(student => {
      const studentExamResults = exams.map(exam => {
        const result = exam.examResults.find(r => r.studentId === student.id);
        return {
          examId: exam.id,
          examName: exam.name,
          examDate: exam.date,
          examFullMarks: exam.fullMarks,
          marksObtained: result?.marksObtained || 0,
          status: result?.status || "NOT_ATTEMPTED",
          feedback: "",
        };
      });

      const validResults = studentExamResults.filter(r => r.marksObtained > 0);
      const totalMarks = validResults.reduce((sum, r) => sum + r.marksObtained, 0);
      const averagePerformance = validResults.length > 0 ? Math.round((totalMarks / validResults.length) * 100) / 100 : 0;
      
      const passCount = studentExamResults.filter(r => r.status === "PASS").length;
      const failCount = studentExamResults.filter(r => r.status === "FAIL").length;
      const totalAttempted = passCount + failCount;
      
      const consistentPerformer = totalAttempted >= 3 && (passCount / totalAttempted) >= 0.8 ? "CONSISTENT_PASS" :
                                 totalAttempted >= 3 && (failCount / totalAttempted) >= 0.8 ? "CONSISTENT_FAIL" : "MIXED";

      return {
        student,
        examResults: studentExamResults,
        averagePerformance,
        totalExamsAttempted: totalAttempted,
        passCount,
        failCount,
        consistentPerformer,
        trend: validResults.length >= 2 ? 
          (validResults[validResults.length - 1].marksObtained > validResults[0].marksObtained ? "IMPROVING" : 
           validResults[validResults.length - 1].marksObtained < validResults[0].marksObtained ? "DECLINING" : "STABLE") : "INSUFFICIENT_DATA",
      };
    });

    // Calculate overall insights
    const insights = {
      totalExams: exams.length,
      totalStudents: allStudents.length,
      overallClassAverage: examStatistics.length > 0 ? 
        Math.round(examStatistics.reduce((sum, e) => sum + e.statistics.averageScore, 0) / examStatistics.length * 100) / 100 : 0,
      
      // Subject difficulty ranking (lower average = more difficult)
      subjectDifficulty: examStatistics.length > 0 ? 
        (examStatistics.reduce((sum, e) => sum + e.statistics.averageScore, 0) / examStatistics.length >= 70 ? "EASY" :
         examStatistics.reduce((sum, e) => sum + e.statistics.averageScore, 0) / examStatistics.length >= 50 ? "MODERATE" : "DIFFICULT") : "UNKNOWN",
      
      // Trends
      performanceTrends: examStatistics.length >= 2 ? {
        improving: studentPerformance.filter(s => s.trend === "IMPROVING").length,
        declining: studentPerformance.filter(s => s.trend === "DECLINING").length,
        stable: studentPerformance.filter(s => s.trend === "STABLE").length,
      } : null,
      
      // At-risk students (consistently failing)
      atRiskStudents: studentPerformance.filter(s => s.consistentPerformer === "CONSISTENT_FAIL"),
      
      // High performers (consistently passing)
      highPerformers: studentPerformance.filter(s => s.consistentPerformer === "CONSISTENT_PASS"),
      
      // Exam difficulty ranking
      examDifficultyRanking: examStatistics
        .sort((a, b) => a.statistics.averageScore - b.statistics.averageScore)
        .map(e => ({
          examName: e.name,
          averageScore: e.statistics.averageScore,
          difficulty: e.statistics.averageScore >= 70 ? "EASY" : 
                      e.statistics.averageScore >= 50 ? "MODERATE" : "DIFFICULT"
        })),
    };

    return NextResponse.json({
      exams: examStatistics,
      studentPerformance,
      insights,
    });
  } catch (error) {
    console.error("Error fetching exam gradebook data:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam data" },
      { status: 500 }
    );
  }
}
