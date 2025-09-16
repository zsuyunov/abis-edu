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
    console.log(`Fetching assignments for teacher: ${userId}`);
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

    console.log(`Found ${teacherAssignments.length} active teacher assignments`);
    
    if (teacherAssignments.length === 0) {
      console.error(`No active teaching assignments found for teacher: ${userId}`);
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
      console.log(`Date range ${startDate} to ${endDate} maps to days:`, daysOfWeek);
      
      // If we have valid days, filter by them
      if (daysOfWeek.length > 0) {
        whereClause.dayOfWeek = {
          in: daysOfWeek
        };
      } else {
        // Fallback: show all timetables if date calculation fails
        console.log('No valid days calculated, showing all timetables');
      }
    } else if (startDate) {
      // If only startDate is provided, get the day of week for that specific date
      const dayOfWeek = getDayNameFromDate(startDate);
      console.log(`Single date ${startDate} maps to day:`, dayOfWeek);
      if (dayOfWeek) {
        whereClause.dayOfWeek = dayOfWeek;
      }
    } else {
      // If no date is provided, show all timetables (weekly view)
      // Don't filter by dayOfWeek
      console.log('No date filtering applied - showing all timetables');
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
    console.log('Fetching timetables with where clause:', JSON.stringify(whereClause, null, 2));
    
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
        topics: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    console.log(`Found ${timetables.length} timetables matching the criteria`);
    
    // Transform the data to match the expected format
    const transformedTimetables = timetables.map(timetable => ({
      ...timetable,
      fullDate: timetable.startTime ? new Date(timetable.startTime).toISOString().split('T')[0] : '',
      startTime: timetable.startTime?.toISOString() || null,
      endTime: timetable.endTime?.toISOString() || null,
      class: {
        ...timetable.class,
        name: timetable.class?.name || `Class ${timetable.classId}`,
        academicYear: timetable.class?.academicYear || { id: 1, name: 'Default' },
        branch: timetable.class?.branch || { id: 'none', shortName: 'N/A' },
      },
      subject: timetable.subject || { id: 'none', name: 'General' },
      branch: timetable.class?.branch || { id: 'none', shortName: 'N/A' },
      topics: timetable.topics || [],
      teacherIds: Array.isArray(timetable.teacherIds) ? timetable.teacherIds : [],
    }));

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