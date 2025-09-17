import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Filter parameters
  const branchId = searchParams.get("branchId");
  const classId = searchParams.get("classId");
  const academicYearId = searchParams.get("academicYearId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const status = searchParams.get("status");
  
  // Date filtering parameters
  const filterType = searchParams.get("filterType"); // day, week, month, year
  const date = searchParams.get("date");
  
  try {
    const where: any = {};
    
    // Apply basic filters
    if (branchId && branchId !== "all") {
      where.branchId = parseInt(branchId);
    }
    if (classId && classId !== "all") {
      where.classId = parseInt(classId);
    }
    if (academicYearId && academicYearId !== "all") {
      where.academicYearId = parseInt(academicYearId);
    }
    if (subjectId && subjectId !== "all") {
      where.subjectId = parseInt(subjectId);
    }
    if (teacherId && teacherId !== "all") {
      where.teacherId = teacherId;
    }
    if (status && status !== "all") {
      where.isActive = status === "ACTIVE";
    }
    
    // Apply date filtering
    if (date && filterType) {
      const filterDate = new Date(date);
      
      switch (filterType) {
        case "day":
          // Filter by specific day
          const startOfDay = new Date(filterDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(filterDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          where.startTime = {
            gte: startOfDay,
            lte: endOfDay,
          };
          break;
          
        case "week":
          // Filter by week (Monday to Sunday)
          const startOfWeek = new Date(filterDate);
          const dayOfWeek = startOfWeek.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          where.startTime = {
            gte: startOfWeek,
            lte: endOfWeek,
          };
          break;
          
        case "month":
          // Filter by month
          const startOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
          const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0, 23, 59, 59, 999);
          
          where.startTime = {
            gte: startOfMonth,
            lte: endOfMonth,
          };
          break;
          
        case "year":
          // Filter by year
          const startOfYear = new Date(filterDate.getFullYear(), 0, 1);
          const endOfYear = new Date(filterDate.getFullYear(), 11, 31, 23, 59, 59, 999);
          
          where.startTime = {
            gte: startOfYear,
            lte: endOfYear,
          };
          break;
      }
    }
    
    const timetables = await prisma.timetable.findMany({
      where,
      select: {
        id: true,
        branchId: true,
        classId: true,
        academicYearId: true,
        dayOfWeek: true,
        subjectId: true,
        teacherIds: true,
        startTime: true,
        endTime: true,
        roomNumber: true,
        buildingName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        timetableTemplateId: true,
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [
        { startTime: "asc" },
      ],
    });

    // Fetch subjects for each timetable
    const timetablesWithSubjects = await Promise.all(
      timetables.map(async (timetable) => {
        const subject = timetable.subjectId 
          ? await prisma.subject.findUnique({
              where: { id: timetable.subjectId },
              select: { id: true, name: true }
            })
          : null;
        
        return {
          ...timetable,
          subject
        };
      })
    );
    
    // Transform timetables to include fullDate field and format times correctly
    const transformedTimetables = timetablesWithSubjects.map(timetable => {
      // Convert Date objects to time strings using UTC to avoid timezone issues
      const formatTime = (date: Date) => {
        // Use UTC methods to avoid timezone conversion issues
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      return {
        ...timetable,
        fullDate: new Date().toISOString().split('T')[0], // Use current date as fallback
        startTime: formatTime(timetable.startTime),
        endTime: formatTime(timetable.endTime),
      };
    });

    return NextResponse.json(transformedTimetables);
  } catch (error) {
    console.error("Error fetching timetables:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetables" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Helper function to create Date object with time, using UTC to avoid timezone issues
    const createTimeDate = (timeString: string | Date) => {
      if (!timeString) return undefined;

      if (timeString instanceof Date) {
        return timeString;
      }

      if (typeof timeString === 'string') {
        // If it's an ISO string, parse it as is
        if (timeString.includes('T')) {
          return new Date(timeString);
        }

        // Handle time string format "HH:mm" - create in UTC to avoid timezone issues
        const [hours, minutes] = timeString.split(':').map(Number);
        const utcDate = new Date('1970-01-01T00:00:00.000Z'); // Start with UTC date
        utcDate.setUTCHours(hours, minutes, 0, 0); // Set hours and minutes in UTC
        return utcDate;
      }
      return undefined;
    };

    const timetable = await prisma.timetable.create({
      data: {
        branchId: body.branchId,
        classId: body.classId,
        academicYearId: body.academicYearId,
        subjectId: body.subjectId,
        teacherIds: body.teacherId ? [body.teacherId] : [],
        dayOfWeek: body.dayOfWeek,
        startTime: createTimeDate(body.startTime) || new Date('1970-01-01T00:00:00.000Z'),
        endTime: createTimeDate(body.endTime) || new Date('1970-01-01T00:00:00.000Z'),
        roomNumber: body.roomNumber,
        buildingName: body.buildingName || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      include: {
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(timetable, { status: 201 });
  } catch (error) {
    console.error("Error creating timetable:", error);
    return NextResponse.json(
      { error: "Failed to create timetable" },
      { status: 500 }
    );
  }
}
