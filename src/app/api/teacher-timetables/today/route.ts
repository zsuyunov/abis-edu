import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher's assignments
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: userId,
        status: "ACTIVE",
      },
      include: {
        Class: true,
        Subject: true,
        Branch: true,
      },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ timetables: [] });
    }

    // Get today's date range
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Get teacher's assigned class and subject IDs
    const assignedClassIds = teacherAssignments.map(ta => ta.classId);
    const assignedSubjectIds = teacherAssignments
      .filter(ta => ta.subjectId !== null)
      .map(ta => ta.subjectId as number); // Cast to number since we filtered out nulls

    // Build the where clause for the timetable query
    const whereClause: any = {
      isActive: true,
      startTime: {
        gte: today,
        lte: endOfToday,
      },
      OR: [
        // Match by class and subject if subjects are assigned
        ...(assignedSubjectIds.length > 0 ? [{
          classId: { in: assignedClassIds },
          subjectId: { in: assignedSubjectIds },
        }] : []),
        // Always include classes where no specific subject is assigned
        {
          classId: { in: assignedClassIds },
          subjectId: null,
        },
      ],
    };

    // Get today's timetables for the teacher's assigned classes and subjects
    const todaysTimetables = await prisma.timetable.findMany({
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
        // Note: 'homework' relation is not directly available in the Timetable model
        // We'll handle homework separately if needed
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get upcoming timetables for today
    const upcomingToday = todaysTimetables.filter(timetable =>
      timetable.startTime >= now
    );

    // Define interface for the transformed timetable
    interface TransformedTimetable {
      id: string;
      fullDate: string;
      startTime: string;
      endTime: string;
      class: {
        id: string;
        name: string;
        branch: { id: string; shortName: string; };
        academicYear: { id: number; name: string; };
      };
      subject: { id: string; name: string; };
      branch: { id: string; shortName: string; };
      topics: Array<{ id: string; title: string; description: string }>;
    }

    // Transform timetables to include fullDate field and ensure consistent data structure
    const transformTimetable = (timetable: any): TransformedTimetable => ({
      ...timetable,
      fullDate: new Date().toISOString().split('T')[0],
      startTime: timetable.startTime?.toISOString() || timetable.startTime,
      endTime: timetable.endTime?.toISOString() || timetable.endTime,
      class: {
        ...timetable.class,
        name: timetable.class?.name || `Class ${timetable.classId}`,
        academicYear: timetable.class?.academicYear || { id: 1, name: 'Default' },
        branch: timetable.class?.branch || { id: 'none', shortName: 'N/A' }
      },
      subject: timetable.subject || { id: 'none', name: 'General' },
      branch: timetable.class?.branch || { id: 'none', shortName: 'N/A' },
      topics: timetable.topics || []
    });

    const transformedTodaysTimetables = todaysTimetables.map(transformTimetable);
    const transformedUpcomingToday = upcomingToday.map(transformTimetable);

    return NextResponse.json({
      todaysTimetables: transformedTodaysTimetables,
      upcomingToday: transformedUpcomingToday,
      teacherAssignments,
    });
  } catch (error) {
    console.error("Error fetching today's teacher timetables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}