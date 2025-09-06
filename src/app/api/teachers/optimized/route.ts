import { NextRequest, NextResponse } from "next/server";
import prisma, { getPaginationParams, buildSearchQuery, optimizedInclude } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status') || 'ACTIVE';

    const { skip, take } = getPaginationParams(page, limit);
    const searchQuery = buildSearchQuery(search, ['firstName', 'lastName', 'teacherId']);

    const where: any = { status, ...searchQuery };
    if (branchId) where.branchId = Number(branchId);

    const [teachers, totalCount] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: optimizedInclude.teacher,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip,
        take,
      }),
      prisma.teacher.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        teachers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    });
  } catch (error) {
    console.error('Optimized Teachers API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch teachers' }, { status: 500 });
  }
}


