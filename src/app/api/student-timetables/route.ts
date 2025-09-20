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
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get all unique teacher IDs from all timetables
    const allTeacherIds = Array.from(new Set(
      timetables.flatMap(t => t.teacherIds || [])
    ));

    // Fetch teacher details for all teacher IDs
    const teachers = allTeacherIds.length > 0 ? await prisma.teacher.findMany({
      where: {
        id: { in: allTeacherIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherId: true,
        email: true
      }
    }) : [];

    // Create a map for quick teacher lookup
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher]));

    // Group timetables by time slot and day to combine multiple subjects/teachers
    const groupedTimetables = new Map();
    
    timetables.forEach(timetable => {
      const formatTime = (date: Date) => {
        // Use UTC methods to avoid timezone conversion issues
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const timeKey = `${timetable.dayOfWeek}-${formatTime(timetable.startTime)}-${formatTime(timetable.endTime)}-${timetable.classId}-${timetable.roomNumber || ''}`;
      
      if (!groupedTimetables.has(timeKey)) {
        groupedTimetables.set(timeKey, {
          id: timetable.id, // Use first timetable ID as primary
          branchId: timetable.branchId,
          classId: timetable.classId,
          academicYearId: timetable.academicYearId,
          dayOfWeek: timetable.dayOfWeek,
          startTime: formatTime(timetable.startTime),
          endTime: formatTime(timetable.endTime),
          roomNumber: timetable.roomNumber,
          buildingName: timetable.buildingName,
          isActive: timetable.isActive,
          createdAt: timetable.createdAt,
          updatedAt: timetable.updatedAt,
          branch: timetable.branch,
          class: timetable.class,
          academicYear: timetable.academicYear,
          subjectIds: [],
          subjects: [],
          teacherIds: [],
          teachers: []
        });
      }
      
      const grouped = groupedTimetables.get(timeKey);
      
      // Add subject if not already present
      if (timetable.subject && !grouped.subjectIds.includes(timetable.subject.id)) {
        grouped.subjectIds.push(timetable.subject.id);
        grouped.subjects.push(timetable.subject);
      }
      
      // Add teachers if not already present
      if (timetable.teacherIds && timetable.teacherIds.length > 0) {
        timetable.teacherIds.forEach(teacherId => {
          if (!grouped.teacherIds.includes(teacherId)) {
            grouped.teacherIds.push(teacherId);
            // Add teacher details if available
            const teacher = teacherMap.get(teacherId);
            if (teacher) {
              grouped.teachers.push(teacher);
            }
          }
        });
      }
    });

    // Convert map to array and sort by start time
    const formattedTimetables = Array.from(groupedTimetables.values()).sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
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
      timetables: formattedTimetables,
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