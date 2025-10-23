import { NextRequest, NextResponse } from "next/server";
import prisma, { withPrismaRetry } from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('STUDENT', 'PARENT')(async function GET(request: NextRequest) {
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
    const student = await withPrismaRetry(() => 
      prisma.student.findUnique({
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
      })
    );

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

    // Get student's elective subject assignments
    const electiveAssignments = await prisma.electiveStudentAssignment.findMany({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      },
      include: {
        electiveSubject: {
          include: {
            electiveGroup: true,
            subject: true
          }
        }
      }
    });

    const electiveSubjectIds = electiveAssignments.map(a => a.electiveSubjectId);

    // Build where clause for regular class timetables
    const classWhereClause: any = {
      classId: student.classId,
      academicYearId: parseInt(targetAcademicYearId!),
      isActive: true,
      electiveSubjectId: null, // Exclude elective timetables
    };

    // Build where clause for elective timetables
    const electiveWhereClause: any = {
      electiveSubjectId: { in: electiveSubjectIds },
      academicYearId: parseInt(targetAcademicYearId!),
      isActive: true,
    };

    if (subjectId) {
      const parsedSubjectId = parseInt(subjectId);
      if (!isNaN(parsedSubjectId)) {
        classWhereClause.subjectId = parsedSubjectId;
        electiveWhereClause.subjectId = parsedSubjectId;
      }
    }

    if (startDate && endDate) {
      const dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
      classWhereClause.startTime = dateFilter;
      electiveWhereClause.startTime = dateFilter;
    }

    // Get regular class timetables
    const classTimetables = await prisma.timetable.findMany({
      where: classWhereClause,
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
        timetableTopics: true, // Include timetable topics
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get elective timetables (only if student has elective assignments)
    const electiveTimetables = electiveSubjectIds.length > 0 ? await prisma.timetable.findMany({
      where: electiveWhereClause,
      include: {
        subject: true,
        class: true,
        branch: true,
        academicYear: true,
        electiveGroup: true,
        electiveSubject: {
          include: {
            subject: true
          }
        },
        timetableTopics: true, // Include timetable topics
      },
      orderBy: {
        startTime: "asc",
      },
    }) : [];

    // Merge class and elective timetables
    const timetables = [...classTimetables, ...electiveTimetables];

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

    // Process timetables - for electives, only show subjects the student is assigned to
    const processedTimetables = new Map();
    
    timetables.forEach((timetable: any) => {
      const formatTime = (date: Date) => {
        // Use UTC methods to avoid timezone conversion issues
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const isElective = !!timetable.electiveSubjectId;
      
      // For elective timetables, check if student is assigned to this specific elective subject
      if (isElective) {
        const isStudentAssigned = electiveSubjectIds.includes(timetable.electiveSubjectId);
        if (!isStudentAssigned) {
          return; // Skip this timetable if student is not assigned to this elective subject
        }
      }

      // Create unique key for each timetable entry
      const timeKey = isElective 
        ? `${timetable.dayOfWeek}-${formatTime(timetable.startTime)}-${formatTime(timetable.endTime)}-elective-${timetable.electiveSubjectId}`
        : `${timetable.dayOfWeek}-${formatTime(timetable.startTime)}-${formatTime(timetable.endTime)}-class-${timetable.classId}-subject-${timetable.subjectId}`;
      
      if (!processedTimetables.has(timeKey)) {
        processedTimetables.set(timeKey, {
          id: timetable.id,
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
          electiveGroup: timetable.electiveGroup || null,
          electiveSubject: timetable.electiveSubject || null,
          isElective: isElective,
          // For students, show only the specific subject they're assigned to
          subjectIds: [timetable.subject?.id].filter(Boolean),
          subjects: timetable.subject ? [timetable.subject] : [],
          teacherIds: timetable.teacherIds || [],
          teachers: []
        });

        // Add teacher details
        const grouped = processedTimetables.get(timeKey);
        if (timetable.teacherIds && timetable.teacherIds.length > 0) {
          timetable.teacherIds.forEach((teacherId: string) => {
            const teacher = teacherMap.get(teacherId);
            if (teacher) {
              grouped.teachers.push(teacher);
            }
          });
        }
      }
    });

    // Convert map to array and sort by start time
    const formattedTimetables = Array.from(processedTimetables.values()).sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    // Get subjects for filter - include both class subjects and elective subjects
    const classSubjects = await prisma.subject.findMany({
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

    // Get elective subjects that the student is assigned to
    const electiveSubjects = await prisma.subject.findMany({
      where: {
        electiveSubjects: {
          some: {
            id: { in: electiveSubjectIds },
            status: 'ACTIVE'
          }
        }
      },
      orderBy: { name: "asc" },
    });

    // Combine and deduplicate subjects
    const allSubjects = [...classSubjects, ...electiveSubjects];
    const uniqueSubjects = allSubjects.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    );
    const subjects = uniqueSubjects.sort((a, b) => a.name.localeCompare(b.name));

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
}));