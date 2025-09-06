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
      where.status = status;
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
          
          where.fullDate = {
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
          
          where.fullDate = {
            gte: startOfWeek,
            lte: endOfWeek,
          };
          break;
          
        case "month":
          // Filter by month
          const startOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
          const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0, 23, 59, 59, 999);
          
          where.fullDate = {
            gte: startOfMonth,
            lte: endOfMonth,
          };
          break;
          
        case "year":
          // Filter by year
          const startOfYear = new Date(filterDate.getFullYear(), 0, 1);
          const endOfYear = new Date(filterDate.getFullYear(), 11, 31, 23, 59, 59, 999);
          
          where.fullDate = {
            gte: startOfYear,
            lte: endOfYear,
          };
          break;
      }
    }
    
    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { 
          select: { 
                        id: true,
            firstName: true, 
            lastName: true
          } 
        },
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
    });
    
    return NextResponse.json(timetables);
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
    
    const timetable = await prisma.timetable.create({
      data: {
        branchId: body.branchId,
        classId: body.classId,
        academicYearId: body.academicYearId,
        subjectId: body.subjectId,
        teacherId: body.teacherId,
        fullDate: new Date(body.fullDate),
        day: body.day,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        roomNumber: body.roomNumber,
        buildingName: body.buildingName || null,
        status: body.status || "ACTIVE",
      },
      include: {
        branch: { select: { id: true, shortName: true } },
        class: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        teacher: { 
          select: { 
                        id: true,
            firstName: true, 
            lastName: true
          } 
        },
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
