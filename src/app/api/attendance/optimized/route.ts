import { NextRequest, NextResponse } from "next/server";
import prisma, { getPaginationParams, optimizedInclude } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const academicYearId = searchParams.get('academicYearId');

    // Build pagination params
    const { skip, take } = getPaginationParams(page, limit);

    // Build filters
    const filters: any = {};

    if (branchId) filters.branchId = parseInt(branchId);
    if (classId) filters.classId = parseInt(classId);
    if (teacherId) filters.teacherId = teacherId;
    if (studentId) filters.studentId = studentId;
    if (academicYearId) filters.academicYearId = parseInt(academicYearId);
    if (status) filters.status = status;
    
    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      filters.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Execute optimized queries in parallel
    const [attendance, totalCount] = await Promise.all([
      prisma.attendance.findMany({
        where: filters,
        include: optimizedInclude.attendance,
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take,
      }),
      prisma.attendance.count({
        where: filters,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get summary statistics
    const summaryFilters = { ...filters };
    delete summaryFilters.date; // Remove date filter for overall stats

    const summary = await prisma.attendance.groupBy({
      by: ['status'],
      where: summaryFilters,
      _count: {
        id: true,
      },
    });

    const summaryStats = {
      present: summary.find(s => s.status === 'PRESENT')?._count.id || 0,
      absent: summary.find(s => s.status === 'ABSENT')?._count.id || 0,
      late: summary.find(s => s.status === 'LATE')?._count.id || 0,
      excused: summary.find(s => s.status === 'EXCUSED')?._count.id || 0,
      total: summary.reduce((acc, s) => acc + s._count.id, 0),
    };

    const response = NextResponse.json({
      success: true,
      data: {
        attendance,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext,
          hasPrev,
        },
        summary: summaryStats,
      }
    });

    // Set cache headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error("Optimized Attendance API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch attendance",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['studentId', 'timetableId', 'teacherId', 'branchId', 'classId', 'subjectId', 'academicYearId', 'date', 'status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate attendance
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_timetableId_date: {
          studentId: body.studentId,
          timetableId: parseInt(body.timetableId),
          date: new Date(body.date),
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, error: "Attendance already recorded for this student, timetable, and date" },
        { status: 400 }
      );
    }

    // Create attendance with optimized query
    const attendance = await prisma.attendance.create({
      data: {
        ...body,
        timetableId: parseInt(body.timetableId),
        branchId: parseInt(body.branchId),
        classId: parseInt(body.classId),
        subjectId: parseInt(body.subjectId),
        academicYearId: parseInt(body.academicYearId),
        date: new Date(body.date),
      },
      include: optimizedInclude.attendance,
    });

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Create attendance error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create attendance",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Bulk attendance creation for efficiency
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceRecords } = body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: "attendanceRecords array is required" },
        { status: 400 }
      );
    }

    // Process attendance records in batches for better performance
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(record => 
          prisma.attendance.upsert({
            where: {
              studentId_timetableId_date: {
                studentId: record.studentId,
                timetableId: parseInt(record.timetableId),
                date: new Date(record.date),
              }
            },
            update: {
              status: record.status,
              notes: record.notes,
            },
            create: {
              ...record,
              timetableId: parseInt(record.timetableId),
              branchId: parseInt(record.branchId),
              classId: parseInt(record.classId),
              subjectId: parseInt(record.subjectId),
              academicYearId: parseInt(record.academicYearId),
              date: new Date(record.date),
            },
            include: optimizedInclude.attendance,
          })
        )
      );

      results.push(...batchResults);
    }

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message }),
      }
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process bulk attendance",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
