import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Use header-based authentication like teacher-timetables
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId") || userId;
    const academicYearId = url.searchParams.get("academicYearId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const view = url.searchParams.get("view") || "weekly"; // weekly, monthly, termly, yearly

    // Get student information with class details
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
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.classId) {
      return NextResponse.json({ error: "Student class information is missing" }, { status: 400 });
    }

    // Verify that the current user can access this student's data
    if (userId !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get current academic year if not specified
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { isCurrent: true, status: "ACTIVE" },
      });
      targetAcademicYearId = currentYear?.id?.toString() || null;
    }

    if (!targetAcademicYearId) {
      return NextResponse.json({ error: "No academic year available" }, { status: 404 });
    }

    // Build where clause
    const whereClause: any = {
      classId: student.classId,
      academicYearId: parseInt(targetAcademicYearId!),
      isActive: true,
    };

    if (subjectId) {
      const parsedSubjectId = parseInt(subjectId);
      if (!isNaN(parsedSubjectId)) {
        whereClause.subjectId = parsedSubjectId;
      }
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get timetables
    const timetables = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        class: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get subjects for filter
    const subjects = await prisma.subject.findMany({
      where: {
        TeacherAssignment: {
          some: {
            classId: student.classId,
            branchId: student.branchId || 0, // Handle null branchId
            status: "ACTIVE",
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get academic years
    const availableAcademicYears = await prisma.academicYear.findMany({
      where: {
        classes: {
          some: {
            students: {
              some: {
                id: studentId,
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class || null,
        branch: student.branch || null,
      },
      timetables,
      subjects,
      availableAcademicYears,
      filters: {
        academicYearId: targetAcademicYearId || null,
        subjectId: subjectId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        view,
      },
    });
  } catch (error) {
    console.error("Error fetching student timetables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}