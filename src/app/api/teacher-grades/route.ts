import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { gradeSchema, bulkGradeSchema } from "@/lib/formValidationSchemas";

export async function GET(request: NextRequest) {
  try {
    // Fallback auth using Authorization header token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';
    const session = token ? { user: AuthService.verifyToken(token) } : null;
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId") || (session.user as any).id;
    const branchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const gradeType = url.searchParams.get("gradeType"); // DAILY, WEEKLY, etc.
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const studentId = url.searchParams.get("studentId");
    const view = url.searchParams.get("view") || "overview"; // overview, analytics, export
    
    // Verify teacher access
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information with branch assignment
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        branch: true,
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
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Ensure teacher can only access data from their assigned branch
    const teacherBranchId = teacher.branchId;
    
    // If a specific branch is requested, verify it matches teacher's branch
    const requestedBranchId = branchId;
    if (requestedBranchId && parseInt(requestedBranchId) !== teacherBranchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
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

    // Build filter conditions for grades query with mandatory branch restriction
    const where: any = {
      teacherId,
      branchId: teacherBranchId, // Always filter by teacher's assigned branch
      status: "ACTIVE",
    };

    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (classId) where.classId = parseInt(classId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (gradeType) where.type = gradeType;
    if (studentId) where.studentId = studentId;

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get grades with related data
    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
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
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { student: { firstName: "asc" } },
      ],
    });

    if (view === "analytics") {
      return getGradeAnalytics(grades, teacher, {
        branchId,
        academicYearId,
        classId,
        subjectId,
        gradeType,
        startDate,
        endDate,
      });
    }

    // Get students for the selected class/subject (for grade input)
    let students = [];
    if (classId && subjectId) {
      const classInfo = await prisma.class.findFirst({
        where: {
          id: parseInt(classId),
          teacherId: teacherId, // Ensure teacher is assigned to this class
        },
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
      });

      if (classInfo) {
        students = classInfo.students;
      }
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        teacherId: teacher.teacherId,
      },
      grades,
      students,
      filters: {
        availableBranches,
        availableAcademicYears,
        availableClasses,
        availableSubjects,
      },
      summary: {
        totalGrades: grades.length,
        averageGrade: grades.length > 0 ? 
          Math.round((grades.reduce((sum, g) => sum + g.value, 0) / grades.length) * 100) / 100 : 0,
        gradesByType: getGradesByType(grades),
        recentGrades: grades.slice(0, 10),
      },
    });

  } catch (error) {
    console.error("Error fetching teacher grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';
    const session = token ? { user: AuthService.verifyToken(token) } : null;
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const teacherId = (session.user as any).id;

    // Check if this is a bulk operation
    if (body.grades && Array.isArray(body.grades)) {
      // Bulk grade entry
      const validation = bulkGradeSchema.safeParse({
        ...body,
        teacherId,
      });

      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.errors },
          { status: 400 }
        );
      }

      const { grades: gradeData, branchId, academicYearId, classId, subjectId, type, date } = validation.data;

      // Verify teacher has access to this class and subject
      const teacherAccess = await verifyTeacherAccess(teacherId, classId, subjectId);
      if (!teacherAccess) {
        return NextResponse.json({ error: "Access denied to this class/subject" }, { status: 403 });
      }

      // Create grades in bulk
      const createdGrades = await prisma.$transaction(async (tx) => {
        const grades = [];
        
        for (const gradeItem of gradeData) {
          const grade = await tx.grade.create({
            data: {
              value: gradeItem.value,
              maxValue: gradeItem.maxValue || 100,
              type,
              description: gradeItem.description || "",
              date,
              week: type === "WEEKLY" ? getWeekNumber(date) : undefined,
              month: type === "MONTHLY" ? date.getMonth() + 1 : undefined,
              term: type === "TERMLY" ? getTerm(date) : undefined,
              year: date.getFullYear(),
              studentId: gradeItem.studentId,
              branchId,
              classId,
              academicYearId,
              subjectId,
              teacherId,
              timetableId: gradeItem.timetableId,
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
          grades.push(grade);
        }
        
        return grades;
      });

      return NextResponse.json({
        success: true,
        grades: createdGrades,
        message: `${createdGrades.length} grades created successfully`,
      });

    } else {
      // Single grade entry
      const validation = gradeSchema.safeParse({
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

      // Verify teacher has access to this class and subject
      const teacherAccess = await verifyTeacherAccess(teacherId, data.classId, data.subjectId);
      if (!teacherAccess) {
        return NextResponse.json({ error: "Access denied to this class/subject" }, { status: 403 });
      }

      // Auto-calculate time-based fields
      const gradeDate = new Date(data.date);
      const gradeData = {
        ...data,
        week: data.type === "WEEKLY" ? getWeekNumber(gradeDate) : data.week,
        month: data.type === "MONTHLY" ? gradeDate.getMonth() + 1 : data.month,
        term: data.type === "TERMLY" ? getTerm(gradeDate) : data.term,
        year: gradeDate.getFullYear(),
      };

      const grade = await prisma.grade.create({
        data: gradeData,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
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
      });

      return NextResponse.json({
        success: true,
        grade,
        message: "Grade created successfully",
      });
    }

  } catch (error) {
    console.error("Error creating grade:", error);
    return NextResponse.json(
      { error: "Failed to create grade" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || '';
    const session = token ? { user: AuthService.verifyToken(token) } : null;
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const teacherId = (session.user as any).id;

    const validation = gradeSchema.safeParse({
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
      return NextResponse.json({ error: "Grade ID is required for update" }, { status: 400 });
    }

    // Verify teacher owns this grade
    const existingGrade = await prisma.grade.findFirst({
      where: {
        id,
        teacherId,
      },
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Grade not found or access denied" }, { status: 404 });
    }

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
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
    });

    return NextResponse.json({
      success: true,
      grade: updatedGrade,
      message: "Grade updated successfully",
    });

  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Failed to update grade" },
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
    const gradeId = url.searchParams.get("id");
    const teacherId = session.id;

    if (!gradeId) {
      return NextResponse.json({ error: "Grade ID is required" }, { status: 400 });
    }

    // Verify teacher owns this grade
    const existingGrade = await prisma.grade.findFirst({
      where: {
        id: parseInt(gradeId),
        teacherId,
      },
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Grade not found or access denied" }, { status: 404 });
    }

    await prisma.grade.delete({
      where: { id: parseInt(gradeId) },
    });

    return NextResponse.json({
      success: true,
      message: "Grade deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 }
    );
  }
}

// Helper functions
async function verifyTeacherAccess(teacherId: string, classId: number, subjectId: number) {
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      OR: [
        { classes: { some: { id: classId } } },
        { subjects: { some: { id: subjectId, classes: { some: { id: classId } } } } },
      ],
    },
  });
  return !!teacher;
}

function getGradesByType(grades: any[]) {
  const gradesByType: Record<string, number> = {};
  grades.forEach(grade => {
    gradesByType[grade.type] = (gradesByType[grade.type] || 0) + 1;
  });
  return gradesByType;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getTerm(date: Date): number {
  const month = date.getMonth() + 1;
  if (month <= 3) return 1;      // Jan-Mar: Term 1
  if (month <= 6) return 2;      // Apr-Jun: Term 2
  if (month <= 9) return 3;      // Jul-Sep: Term 3
  return 4;                      // Oct-Dec: Term 4
}

async function getGradeAnalytics(grades: any[], teacher: any, filters: any) {
  // Calculate analytics
  const totalGrades = grades.length;
  const averageGrade = totalGrades > 0 ? 
    Math.round((grades.reduce((sum, g) => sum + g.value, 0) / totalGrades) * 100) / 100 : 0;

  // Grade distribution
  const gradeDistribution = {
    excellent: grades.filter(g => g.value >= 90).length,
    good: grades.filter(g => g.value >= 70 && g.value < 90).length,
    satisfactory: grades.filter(g => g.value >= 50 && g.value < 70).length,
    poor: grades.filter(g => g.value < 50).length,
  };

  // Student performance
  const studentPerformance = {};
  grades.forEach(grade => {
    const studentId = grade.student.id;
    if (!studentPerformance[studentId]) {
      studentPerformance[studentId] = {
        student: grade.student,
        grades: [],
        average: 0,
        total: 0,
      };
    }
    studentPerformance[studentId].grades.push(grade);
    studentPerformance[studentId].total += grade.value;
  });

  // Calculate averages for each student
  Object.keys(studentPerformance).forEach(studentId => {
    const student = studentPerformance[studentId];
    student.average = Math.round((student.total / student.grades.length) * 100) / 100;
  });

  // Top and bottom performers
  const studentList = Object.values(studentPerformance).sort((a: any, b: any) => b.average - a.average);
  const topPerformers = studentList.slice(0, 5);
  const bottomPerformers = studentList.slice(-5).reverse();

  // Grade trends over time
  const gradeTrends = {};
  grades.forEach(grade => {
    const monthKey = `${grade.date.getFullYear()}-${String(grade.date.getMonth() + 1).padStart(2, '0')}`;
    if (!gradeTrends[monthKey]) {
      gradeTrends[monthKey] = {
        month: monthKey,
        totalGrades: 0,
        totalValue: 0,
        average: 0,
      };
    }
    gradeTrends[monthKey].totalGrades++;
    gradeTrends[monthKey].totalValue += grade.value;
    gradeTrends[monthKey].average = Math.round((gradeTrends[monthKey].totalValue / gradeTrends[monthKey].totalGrades) * 100) / 100;
  });

  const trendData = Object.values(gradeTrends).sort((a: any, b: any) => a.month.localeCompare(b.month));

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      teacherId: teacher.teacherId,
    },
    analytics: {
      summary: {
        totalGrades,
        averageGrade,
        passRate: Math.round((grades.filter(g => g.value >= 50).length / totalGrades) * 100) || 0,
        gradeDistribution,
      },
      studentPerformance: {
        topPerformers,
        bottomPerformers,
        allStudents: studentList,
      },
      trends: {
        gradeTrends: trendData,
        gradesByType: getGradesByType(grades),
      },
    },
    filters,
  });
}
