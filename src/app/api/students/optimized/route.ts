import { NextRequest, NextResponse } from "next/server";
import prisma, { getPaginationParams, buildSearchQuery, optimizedInclude } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status') || 'ACTIVE';

    // Build pagination params
    const { skip, take } = getPaginationParams(page, limit);

    // Build search query
    const searchQuery = buildSearchQuery(search, ['firstName', 'lastName', 'studentId']);

    // Build filters
    const filters: any = {
      status,
      ...searchQuery,
    };

    if (branchId) {
      filters.branchId = parseInt(branchId);
    }

    if (classId) {
      filters.classId = parseInt(classId);
    }

    // Execute optimized queries in parallel
    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        where: filters,
        include: optimizedInclude.student,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ],
        skip,
        take,
      }),
      prisma.student.count({
        where: filters,
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get summary statistics with error handling
    let summaryStats = { active: 0, inactive: 0, total: 0 };
    
    try {
      const summary = await prisma.student.groupBy({
        by: ['status'],
        where: branchId ? { branchId: parseInt(branchId) } : {},
        _count: {
          id: true,
        },
      });

      summaryStats = {
        active: summary.find(s => s.status === 'ACTIVE')?._count.id || 0,
        inactive: summary.find(s => s.status === 'INACTIVE')?._count.id || 0,
        total: summary.reduce((acc, s) => acc + s._count.id, 0),
      };
    } catch (error) {
      console.error("Error fetching student summary statistics:", error);
      // Use fallback values if groupBy fails
      summaryStats = { active: 0, inactive: 0, total: 0 };
    }

    const response = NextResponse.json({
      success: true,
      data: {
        students,
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
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error("Optimized Students API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch students",
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
    const requiredFields = ['firstName', 'lastName', 'studentId', 'branchId', 'classId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create student with optimized query
    const student = await prisma.student.create({
      data: {
        ...body,
        branchId: parseInt(body.branchId),
        classId: parseInt(body.classId),
      },
      include: optimizedInclude.student,
    });

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create student",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
