import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { attendanceSchema, bulkAttendanceSchema, attendanceFilterSchema } from "@/lib/formValidationSchemas";

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
    const timetableId = url.searchParams.get("timetableId");
    const date = url.searchParams.get("date");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const studentId = url.searchParams.get("studentId");
    const status = url.searchParams.get("status");
    const view = url.searchParams.get("view") || "overview"; // overview, analytics, history, export
    
    // Verify teacher can only access their own data
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information with branch assignment
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        branch: true,
        subjects: true,
        classes: {
          include: {
            academicYear: true,
            branch: true,
            students: {
              include: {
                branch: true,
              },
            },
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
    if (branchId && parseInt(branchId) !== teacherBranchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Get available options for filters (scoped by teacher's branch)
    const availableAcademicYears = await prisma.academicYear.findMany({
      where: {
        classes: {
          some: {
            branchId: teacherBranchId,
            supervisorId: teacherId,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const availableClasses = teacher.classes.filter(c => c.branchId === teacherBranchId);
    const availableSubjects = teacher.subjects;

    // Get teacher's timetables for attendance context
    const timetables = await prisma.timetable.findMany({
      where: {
        teacherId,
        branchId: teacherBranchId,
        status: "ACTIVE",
        ...(academicYearId && { academicYearId: parseInt(academicYearId) }),
        ...(classId && { classId: parseInt(classId) }),
        ...(subjectId && { subjectId: parseInt(subjectId) }),
        ...(date && { fullDate: new Date(date) }),
      },
      include: {
        class: {
          include: {
            students: {
              where: {
                branchId: teacherBranchId, // Only students from teacher's branch
                status: "ACTIVE",
              },
              orderBy: [
                { firstName: "asc" },
                { lastName: "asc" },
              ],
            },
          },
        },
        subject: true,
        academicYear: true,
        branch: true,
      },
      orderBy: [
        { fullDate: "desc" },
        { startTime: "asc" },
      ],
    });

    if (view === "analytics") {
      return getAttendanceAnalytics(teacherId, teacherBranchId, {
        academicYearId,
        classId,
        subjectId,
        startDate,
        endDate,
        studentId,
      });
    }

    // Build filter conditions for attendance records
    const attendanceWhere: any = {
      teacherId,
      branchId: teacherBranchId, // Always filter by teacher's assigned branch
    };

    if (academicYearId) attendanceWhere.academicYearId = parseInt(academicYearId);
    if (classId) attendanceWhere.classId = parseInt(classId);
    if (subjectId) attendanceWhere.subjectId = parseInt(subjectId);
    if (timetableId) attendanceWhere.timetableId = parseInt(timetableId);
    if (studentId) attendanceWhere.studentId = studentId;
    if (status) attendanceWhere.status = status;

    if (date) {
      attendanceWhere.date = new Date(date);
    } else if (startDate && endDate) {
      attendanceWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get attendance records with related data
    const attendances = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        timetable: {
          include: {
            class: true,
            subject: true,
            academicYear: true,
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
            legalName: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { student: { firstName: "asc" } },
      ],
    });

    // Calculate summary statistics
    const summary = calculateAttendanceSummary(attendances);

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        branch: teacher.branch,
      },
      attendances,
      timetables,
      summary,
      availableFilters: {
        academicYears: availableAcademicYears,
        classes: availableClasses,
        subjects: availableSubjects,
      },
      view,
    });

  } catch (error) {
    console.error("Error fetching teacher attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
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
    
    // Check if it's bulk attendance or single attendance
    const isBulk = Array.isArray(body.attendances);
    
    if (isBulk) {
      // Validate bulk attendance data
      const validatedData = bulkAttendanceSchema.parse(body);
      
      // Verify teacher can only create attendance for their assigned branch
      const teacher = await prisma.teacher.findUnique({
        where: { id: validatedData.teacherId },
        select: { branchId: true },
      });

      if (!teacher || teacher.branchId !== validatedData.branchId) {
        return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
      }

      if (session.id !== validatedData.teacherId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Check if attendance already exists for this date/timetable
      const existingAttendances = await prisma.attendance.findMany({
        where: {
          timetableId: validatedData.timetableId,
          date: validatedData.date,
          teacherId: validatedData.teacherId,
        },
      });

      if (existingAttendances.length > 0) {
        return NextResponse.json(
          { error: "Attendance already exists for this date and timetable" },
          { status: 400 }
        );
      }

      // Create bulk attendance records
      const attendanceRecords = validatedData.attendances.map(attendance => ({
        studentId: attendance.studentId,
        timetableId: validatedData.timetableId,
        teacherId: validatedData.teacherId,
        branchId: validatedData.branchId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        academicYearId: validatedData.academicYearId,
        date: validatedData.date,
        status: attendance.status,
        notes: attendance.notes || null,
      }));

      const createdAttendances = await prisma.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: true,
      });

      return NextResponse.json({
        message: "Bulk attendance recorded successfully",
        count: createdAttendances.count,
      }, { status: 201 });

    } else {
      // Validate single attendance data
      const validatedData = attendanceSchema.parse(body);
      
      // Verify teacher can only create attendance for their assigned branch
      const teacher = await prisma.teacher.findUnique({
        where: { id: validatedData.teacherId },
        select: { branchId: true },
      });

      if (!teacher || teacher.branchId !== validatedData.branchId) {
        return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
      }

      if (session.id !== validatedData.teacherId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Create single attendance record
      const attendance = await prisma.attendance.create({
        data: {
          studentId: validatedData.studentId,
          timetableId: validatedData.timetableId,
          teacherId: validatedData.teacherId,
          branchId: validatedData.branchId,
          classId: validatedData.classId,
          subjectId: validatedData.subjectId,
          academicYearId: validatedData.academicYearId,
          date: validatedData.date,
          status: validatedData.status,
          notes: validatedData.notes || null,
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
        },
      });

      return NextResponse.json({
        message: "Attendance recorded successfully",
        attendance,
      }, { status: 201 });
    }

  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
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
    const validatedData = attendanceSchema.parse(body);
    
    if (!validatedData.id) {
      return NextResponse.json({ error: "Attendance ID is required for updates" }, { status: 400 });
    }

    // Verify teacher can only update their own attendance records
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: validatedData.id },
      include: {
        teacher: {
          select: {
            branchId: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    if (existingAttendance.teacherId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (existingAttendance.teacher.branchId !== validatedData.branchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Check if attendance is from today (allow same-day edits only)
    const today = new Date();
    const attendanceDate = new Date(existingAttendance.date);
    const isToday = attendanceDate.toDateString() === today.toDateString();

    if (!isToday) {
      return NextResponse.json(
        { error: "Can only edit attendance from today. Historical records are locked." },
        { status: 400 }
      );
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes || null,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Attendance updated successfully",
      attendance: updatedAttendance,
    });

  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
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

  return {
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate,
    absenteeismRate,
  };
}

async function getAttendanceAnalytics(teacherId: string, branchId: number, filters: any) {
  const where: any = {
    teacherId,
    branchId,
  };

  if (filters.academicYearId) where.academicYearId = parseInt(filters.academicYearId);
  if (filters.classId) where.classId = parseInt(filters.classId);
  if (filters.subjectId) where.subjectId = parseInt(filters.subjectId);
  if (filters.studentId) where.studentId = filters.studentId;

  if (filters.startDate && filters.endDate) {
    where.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  const attendances = await prisma.attendance.findMany({
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
      class: true,
      subject: true,
    },
  });

  // Calculate analytics
  const analytics = {
    summary: calculateAttendanceSummary(attendances),
    byStudent: calculateStudentAttendanceStats(attendances),
    byClass: calculateClassAttendanceStats(attendances),
    bySubject: calculateSubjectAttendanceStats(attendances),
    trends: calculateAttendanceTrends(attendances),
    frequentAbsentees: getFrequentAbsentees(attendances),
    perfectAttendance: getPerfectAttendanceStudents(attendances),
  };

  return NextResponse.json({
    analytics,
    filters,
  });
}

function calculateStudentAttendanceStats(attendances: any[]) {
  const studentStats: Record<string, any> = {};

  attendances.forEach(attendance => {
    const studentId = attendance.studentId;
    
    if (!studentStats[studentId]) {
      studentStats[studentId] = {
        student: attendance.student,
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      };
    }

    studentStats[studentId].totalRecords++;
    if (attendance.status === "PRESENT") studentStats[studentId].presentCount++;
    if (attendance.status === "ABSENT") studentStats[studentId].absentCount++;
    if (attendance.status === "LATE") studentStats[studentId].lateCount++;
    if (attendance.status === "EXCUSED") studentStats[studentId].excusedCount++;
  });

  // Calculate rates
  Object.values(studentStats).forEach((stats: any) => {
    stats.attendanceRate = stats.totalRecords > 0 ? 
      Math.round((stats.presentCount / stats.totalRecords) * 100) : 0;
  });

  return Object.values(studentStats).sort((a: any, b: any) => b.attendanceRate - a.attendanceRate);
}

function calculateClassAttendanceStats(attendances: any[]) {
  const classStats: Record<string, any> = {};

  attendances.forEach(attendance => {
    const classId = attendance.classId;
    
    if (!classStats[classId]) {
      classStats[classId] = {
        class: attendance.class,
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
      };
    }

    classStats[classId].totalRecords++;
    if (attendance.status === "PRESENT") classStats[classId].presentCount++;
    if (attendance.status === "ABSENT") classStats[classId].absentCount++;
    if (attendance.status === "LATE") classStats[classId].lateCount++;
    if (attendance.status === "EXCUSED") classStats[classId].excusedCount++;
  });

  // Calculate rates
  Object.values(classStats).forEach((stats: any) => {
    stats.attendanceRate = stats.totalRecords > 0 ? 
      Math.round((stats.presentCount / stats.totalRecords) * 100) : 0;
  });

  return Object.values(classStats);
}

function calculateSubjectAttendanceStats(attendances: any[]) {
  const subjectStats: Record<string, any> = {};

  attendances.forEach(attendance => {
    const subjectId = attendance.subjectId;
    
    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        subject: attendance.subject,
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

  return Object.values(subjectStats);
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

function getFrequentAbsentees(attendances: any[], threshold: number = 20) {
  const studentStats = calculateStudentAttendanceStats(attendances);
  return studentStats
    .filter((stats: any) => stats.absentCount >= threshold || stats.attendanceRate < 80)
    .sort((a: any, b: any) => b.absentCount - a.absentCount)
    .slice(0, 10);
}

function getPerfectAttendanceStudents(attendances: any[]) {
  const studentStats = calculateStudentAttendanceStats(attendances);
  return studentStats
    .filter((stats: any) => stats.attendanceRate === 100 && stats.totalRecords >= 10)
    .sort((a: any, b: any) => b.totalRecords - a.totalRecords);
}
