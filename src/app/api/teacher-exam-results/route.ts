import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { examResultSchema, bulkExamResultSchema } from "@/lib/formValidationSchemas";

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
    const examId = url.searchParams.get("examId");
    const studentId = url.searchParams.get("studentId");
    const view = url.searchParams.get("view") || "overview"; // overview, input, analytics
    
    // Verify teacher access
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information with assigned classes and subjects
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        subjects: {
          include: {
            classes: {
              include: {
                branch: true,
                academicYear: true,
              },
            },
          },
        },
        classes: {
          include: {
            branch: true,
            academicYear: true,
            students: true,
          },
        },
        branch: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get available options for filters
    const availableBranches = teacher.branch ? [teacher.branch] : 
      [...new Set(teacher.classes.map(c => c.branch))];
    
    const availableAcademicYears = [
      ...new Set(teacher.classes.map(c => c.academicYear))
    ];

    const availableClasses = teacher.classes.filter(c => {
      if (branchId && c.branchId !== parseInt(branchId)) return false;
      if (academicYearId && c.academicYearId !== parseInt(academicYearId)) return false;
      return true;
    });

    const availableSubjects = teacher.subjects.filter(s => {
      if (!classId) return true;
      return s.classes.some(c => c.id === parseInt(classId));
    });

    // Get exams assigned to this teacher for the selected filters
    const examWhere: any = {
      teacherId,
      status: "ACTIVE",
    };

    if (branchId) examWhere.branchId = parseInt(branchId);
    if (academicYearId) examWhere.academicYearId = parseInt(academicYearId);
    if (classId) examWhere.classId = parseInt(classId);
    if (subjectId) examWhere.subjectId = parseInt(subjectId);

    const availableExams = await prisma.exam.findMany({
      where: examWhere,
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
        branch: {
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
      orderBy: {
        date: "desc",
      },
    });

    if (view === "input" && examId) {
      // Get exam details and students for result input
      const exam = await prisma.exam.findFirst({
        where: {
          id: parseInt(examId),
          teacherId,
        },
        include: {
          subject: true,
          class: {
            include: {
              students: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentId: true,
                },
                orderBy: {
                  firstName: "asc",
                },
              },
            },
          },
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
      });

      if (!exam) {
        return NextResponse.json({ error: "Exam not found or access denied" }, { status: 404 });
      }

      // Map existing results for easy lookup
      const existingResults = {};
      exam.examResults.forEach(result => {
        existingResults[result.studentId] = result;
      });

      // Prepare student list with existing results
      const studentsWithResults = exam.class.students.map(student => ({
        ...student,
        existingResult: existingResults[student.id] || null,
      }));

      return NextResponse.json({
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          teacherId: teacher.teacherId,
        },
        exam,
        students: studentsWithResults,
        inputMode: true,
      });
    }

    // Build filter conditions for exam results query
    const resultWhere: any = {
      teacherId,
    };

    if (examId) resultWhere.examId = parseInt(examId);
    if (studentId) resultWhere.studentId = studentId;

    // Get exam results with related data
    const examResults = await prisma.examResult.findMany({
      where: resultWhere,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        exam: {
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
            branch: {
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
        { student: { firstName: "asc" } },
      ],
    });

    if (view === "analytics") {
      return getExamAnalytics(examResults, teacher, {
        branchId,
        academicYearId,
        classId,
        subjectId,
        examId,
      });
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        teacherId: teacher.teacherId,
      },
      examResults,
      filters: {
        availableBranches,
        availableAcademicYears,
        availableClasses,
        availableSubjects,
        availableExams,
      },
      summary: {
        totalResults: examResults.length,
        averageScore: examResults.length > 0 ? 
          Math.round((examResults.reduce((sum, r) => sum + r.marksObtained, 0) / examResults.length) * 100) / 100 : 0,
        passRate: examResults.length > 0 ? 
          Math.round((examResults.filter(r => r.status === "PASS").length / examResults.length) * 100) : 0,
        recentResults: examResults.slice(0, 10),
      },
    });

  } catch (error) {
    console.error("Error fetching teacher exam results:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam results" },
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
    const teacherId = session.id;

    // Check if this is a bulk operation
    if (body.results && Array.isArray(body.results)) {
      // Bulk exam result entry
      const validation = bulkExamResultSchema.safeParse({
        ...body,
        teacherId,
      });

      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.errors },
          { status: 400 }
        );
      }

      const { examId, results } = validation.data;

      // Verify teacher has access to this exam
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          teacherId,
        },
      });

      if (!exam) {
        return NextResponse.json({ error: "Exam not found or access denied" }, { status: 404 });
      }

      // Create or update exam results in bulk
      const createdResults = await prisma.$transaction(async (tx) => {
        const resultsList = [];
        
        for (const resultItem of results) {
          // Determine pass/fail based on exam passing mark
          const status = resultItem.marksObtained >= exam.passingMark ? "PASS" : "FAIL";
          
          // Check if result already exists
          const existingResult = await tx.examResult.findUnique({
            where: {
              examId_studentId: {
                examId,
                studentId: resultItem.studentId,
              },
            },
          });

          let result;
          if (existingResult) {
            // Update existing result
            result = await tx.examResult.update({
              where: {
                id: existingResult.id,
              },
              data: {
                marksObtained: resultItem.marksObtained,
                status,
                feedback: resultItem.feedback || "",
                teacherId,
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
              },
            });
          } else {
            // Create new result
            result = await tx.examResult.create({
              data: {
                examId,
                studentId: resultItem.studentId,
                marksObtained: resultItem.marksObtained,
                status,
                feedback: resultItem.feedback || "",
                teacherId,
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
              },
            });
          }
          
          resultsList.push(result);
        }
        
        return resultsList;
      });

      return NextResponse.json({
        success: true,
        examResults: createdResults,
        message: `${createdResults.length} exam results processed successfully`,
      });

    } else {
      // Single exam result entry
      const validation = examResultSchema.safeParse({
        ...body,
        teacherId,
      });

      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.errors },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Verify teacher has access to this exam
      const exam = await prisma.exam.findFirst({
        where: {
          id: data.examId,
          teacherId,
        },
      });

      if (!exam) {
        return NextResponse.json({ error: "Exam not found or access denied" }, { status: 404 });
      }

      // Auto-calculate pass/fail status
      const status = data.marksObtained >= exam.passingMark ? "PASS" : "FAIL";

      // Check if result already exists
      const existingResult = await prisma.examResult.findUnique({
        where: {
          examId_studentId: {
            examId: data.examId,
            studentId: data.studentId,
          },
        },
      });

      let result;
      if (existingResult) {
        // Update existing result
        result = await prisma.examResult.update({
          where: {
            id: existingResult.id,
          },
          data: {
            marksObtained: data.marksObtained,
            status,
            feedback: data.feedback || "",
            teacherId,
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
            exam: {
              select: {
                id: true,
                title: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Create new result
        result = await prisma.examResult.create({
          data: {
            examId: data.examId,
            studentId: data.studentId,
            marksObtained: data.marksObtained,
            status,
            feedback: data.feedback || "",
            teacherId,
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
            exam: {
              select: {
                id: true,
                title: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        examResult: result,
        message: "Exam result saved successfully",
      });
    }

  } catch (error) {
    console.error("Error creating exam result:", error);
    return NextResponse.json(
      { error: "Failed to create exam result" },
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
    const teacherId = session.id;

    const validation = examResultSchema.safeParse({
      ...body,
      teacherId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    if (!id) {
      return NextResponse.json({ error: "Exam result ID is required for update" }, { status: 400 });
    }

    // Verify teacher owns this exam result
    const existingResult = await prisma.examResult.findFirst({
      where: {
        id,
        teacherId,
      },
      include: {
        exam: true,
      },
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Exam result not found or access denied" }, { status: 404 });
    }

    // Auto-calculate pass/fail status
    const status = data.marksObtained >= existingResult.exam.passingMark ? "PASS" : "FAIL";

    const updatedResult = await prisma.examResult.update({
      where: { id },
      data: {
        ...data,
        status,
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
        exam: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      examResult: updatedResult,
      message: "Exam result updated successfully",
    });

  } catch (error) {
    console.error("Error updating exam result:", error);
    return NextResponse.json(
      { error: "Failed to update exam result" },
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
    const resultId = url.searchParams.get("id");
    const teacherId = session.id;

    if (!resultId) {
      return NextResponse.json({ error: "Exam result ID is required" }, { status: 400 });
    }

    // Verify teacher owns this exam result
    const existingResult = await prisma.examResult.findFirst({
      where: {
        id: parseInt(resultId),
        teacherId,
      },
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Exam result not found or access denied" }, { status: 404 });
    }

    await prisma.examResult.delete({
      where: { id: parseInt(resultId) },
    });

    return NextResponse.json({
      success: true,
      message: "Exam result deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting exam result:", error);
    return NextResponse.json(
      { error: "Failed to delete exam result" },
      { status: 500 }
    );
  }
}

// Helper function for analytics
async function getExamAnalytics(examResults: any[], teacher: any, filters: any) {
  const totalResults = examResults.length;
  const averageScore = totalResults > 0 ? 
    Math.round((examResults.reduce((sum, r) => sum + r.marksObtained, 0) / totalResults) * 100) / 100 : 0;
  const passRate = totalResults > 0 ? 
    Math.round((examResults.filter(r => r.status === "PASS").length / totalResults) * 100) : 0;

  // Score distribution
  const scoreDistribution = {
    excellent: examResults.filter(r => r.marksObtained >= 90).length,
    good: examResults.filter(r => r.marksObtained >= 70 && r.marksObtained < 90).length,
    satisfactory: examResults.filter(r => r.marksObtained >= 50 && r.marksObtained < 70).length,
    poor: examResults.filter(r => r.marksObtained < 50).length,
  };

  // Student performance
  const studentPerformance = {};
  examResults.forEach(result => {
    const studentId = result.student.id;
    if (!studentPerformance[studentId]) {
      studentPerformance[studentId] = {
        student: result.student,
        results: [],
        average: 0,
        total: 0,
        passCount: 0,
      };
    }
    studentPerformance[studentId].results.push(result);
    studentPerformance[studentId].total += result.marksObtained;
    if (result.status === "PASS") {
      studentPerformance[studentId].passCount++;
    }
  });

  // Calculate averages for each student
  Object.keys(studentPerformance).forEach(studentId => {
    const student = studentPerformance[studentId];
    student.average = Math.round((student.total / student.results.length) * 100) / 100;
    student.passRate = Math.round((student.passCount / student.results.length) * 100);
  });

  // Top and bottom performers
  const studentList = Object.values(studentPerformance).sort((a: any, b: any) => b.average - a.average);
  const topPerformers = studentList.slice(0, 5);
  const bottomPerformers = studentList.slice(-5).reverse();

  // Exam performance over time
  const examPerformance = {};
  examResults.forEach(result => {
    const examId = result.exam.id;
    if (!examPerformance[examId]) {
      examPerformance[examId] = {
        exam: result.exam,
        totalResults: 0,
        totalScore: 0,
        passCount: 0,
        average: 0,
        passRate: 0,
      };
    }
    examPerformance[examId].totalResults++;
    examPerformance[examId].totalScore += result.marksObtained;
    if (result.status === "PASS") {
      examPerformance[examId].passCount++;
    }
  });

  // Calculate exam averages
  Object.keys(examPerformance).forEach(examId => {
    const exam = examPerformance[examId];
    exam.average = Math.round((exam.totalScore / exam.totalResults) * 100) / 100;
    exam.passRate = Math.round((exam.passCount / exam.totalResults) * 100);
  });

  const examList = Object.values(examPerformance).sort((a: any, b: any) => 
    new Date(b.exam.date).getTime() - new Date(a.exam.date).getTime()
  );

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      teacherId: teacher.teacherId,
    },
    analytics: {
      summary: {
        totalResults,
        averageScore,
        passRate,
        scoreDistribution,
      },
      studentPerformance: {
        topPerformers,
        bottomPerformers,
        allStudents: studentList,
      },
      examPerformance: examList,
    },
    filters,
  });
}
