import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function to get days of week in a date range
function getDaysOfWeekInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: string[] = [];
  
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(dayNames[d.getDay()]);
  }
  
  return Array.from(new Set(days)); // Remove duplicates
}

// Helper function to get day name from date
function getDayNameFromDate(date: string): string {
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return dayNames[new Date(date).getDay()];
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const academicYearId = url.searchParams.get("academicYearId");
    const branchId = url.searchParams.get("branchId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const mode = url.searchParams.get("mode");

    // Get teacher's assignments to determine access
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: userId,
        status: "ACTIVE",
      },
      include: {
        Branch: true,
        AcademicYear: true,
        Class: true,
        Subject: true,
      },
    });


    if (teacherAssignments.length === 0) {
      return NextResponse.json({ 
        error: "No active teaching assignments found" 
      }, { status: 403 });
    }

    // Get academic year
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

    // Build where clause for timetables
    const whereClause: any = {
      academicYearId: parseInt(targetAcademicYearId),
      isActive: true,
      // Exclude legacy "virtual" timetables from all teacher views
      buildingName: { not: 'virtual' }
    };

    // Separate assignments into general (no specific subject) and specific (with subject)
    const generalAssignments = teacherAssignments.filter(ta => ta.subjectId === null);
    const specificAssignments = teacherAssignments.filter(ta => ta.subjectId !== null);

    const generalClassIds = generalAssignments.map(ta => ta.classId);
    const specificClassIds = specificAssignments.map(ta => ta.classId);
    const assignedSubjectIds = specificAssignments.map(ta => ta.subjectId as number);

    // Filter by teacher's assignments based on role
    if (mode === 'supervisor') {
      // For supervisor mode, show all classes in the branch
      const supervisorBranches = teacherAssignments
        .filter(ta => ta.role === 'SUPERVISOR')
        .map(ta => ta.branchId);

      if (supervisorBranches.length > 0) {
        whereClause.branchId = { in: supervisorBranches };
      }
    } else {
        // For regular teacher mode, show timetables where:
        // 1. Teacher has general assignment to class (can see all subjects), OR
        // 2. Teacher has specific assignment to class/subject, OR
        // 3. Teacher is directly assigned to the timetable via teacherIds

        const teacherId = userId;
        const assignmentConditions = [];

        // Condition 1: General class assignments (no specific subject) - can see ALL timetables for these classes
        if (generalClassIds.length > 0) {
          assignmentConditions.push({
            classId: { in: generalClassIds }
            // No subjectId filter - teacher can see all subjects for these classes
          });
        }

        // Condition 2: Specific subject assignments
        if (specificClassIds.length > 0 && assignedSubjectIds.length > 0) {
          assignmentConditions.push({
            classId: { in: specificClassIds },
            subjectId: { in: assignedSubjectIds }
          });
        }

        // Condition 3: Teacher is directly assigned to timetable
        assignmentConditions.push({
          teacherIds: { hasSome: [teacherId] }
        });

        // Combine conditions with OR
        if (assignmentConditions.length > 0) {
          whereClause.OR = assignmentConditions;
        }
      }

    // Apply date filtering using day of week approach
    // For recurring timetables, show schedules for the requested day(s)
    if (startDate && endDate) {
      // Calculate days of week for the date range
      const daysOfWeek = getDaysOfWeekInRange(startDate, endDate);
      
      // If we have valid days, filter by them
      if (daysOfWeek.length > 0) {
        whereClause.dayOfWeek = {
          in: daysOfWeek
        };
      } else {
        // Fallback: show all timetables if date calculation fails
      }
    } else if (startDate) {
      // If only startDate is provided, get the day of week for that specific date
      const dayOfWeek = getDayNameFromDate(startDate);
      if (dayOfWeek) {
        whereClause.dayOfWeek = dayOfWeek;
      }
    } else {
      // If no date is provided, show all timetables (weekly view)
      // Don't filter by dayOfWeek
    }
    
    // Add branch filter if provided
    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }
    
    // Add class filter if provided
    if (classId) {
      whereClause.classId = parseInt(classId);
    }

    // Add subject filter if provided
    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    }

    // Log the final where clause for debugging

    // Fetch timetables with related data
    const timetables = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        subject: true,
        class: {
          include: {
        branch: true,
        academicYear: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
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
        // Use local time to match stored @db.Time values and keep correct order
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const timeKey = `${timetable.dayOfWeek}-${formatTime(timetable.startTime)}-${formatTime(timetable.endTime)}-${timetable.classId}-${timetable.roomNumber || ''}`;
      
      if (!groupedTimetables.has(timeKey)) {
        // Calculate lesson number based on start time
        const getLessonNumber = (startTime: Date) => {
          const hours = startTime.getHours();
          if (hours >= 8 && hours < 9) return 1;
          if (hours >= 9 && hours < 10) return 2;
          if (hours >= 10 && hours < 11) return 3;
          if (hours >= 11 && hours < 12) return 4;
          if (hours >= 12 && hours < 13) return 5;
          if (hours >= 13 && hours < 14) return 6;
          if (hours >= 14 && hours < 15) return 7;
          if (hours >= 15 && hours < 16) return 8;
          if (hours >= 16 && hours < 17) return 9;
          return 0;
        };

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
          lessonNumber: getLessonNumber(timetable.startTime),
          isActive: timetable.isActive,
          createdAt: timetable.createdAt,
          updatedAt: timetable.updatedAt,
          branch: timetable.class?.branch || { id: 'none', shortName: 'N/A' },
          class: {
            ...timetable.class,
            name: timetable.class?.name || `Class ${timetable.classId}`,
            academicYear: timetable.class?.academicYear || { id: 1, name: 'Default' },
            branch: timetable.class?.branch || { id: 'none', shortName: 'N/A' },
          },
          academicYear: timetable.class?.academicYear || { id: 1, name: 'Default' },
          subjectIds: [],
          subjects: [],
          teacherIds: [],
          teachers: [],
          fullDate: timetable.startTime ? new Date(timetable.startTime).toISOString().split('T')[0] : '',
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
    const transformedTimetables = Array.from(groupedTimetables.values()).sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    return NextResponse.json({
      timetables: transformedTimetables,
      teacherAssignments: teacherAssignments.map(ta => ({
        id: ta.id,
        role: ta.role,
        branchId: ta.branchId,
        classId: ta.classId,
        subjectId: ta.subjectId,
      })),
    });
  } catch (error) {
    console.error("Error in teacher timetables API:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher timetables" },
      { status: 500 }
    );
  }
}