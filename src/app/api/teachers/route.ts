import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 120; // ISR cache for 2 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const branchIds = searchParams.get("branchIds");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // NOTE: Current Teacher model does not contain branchId. We ignore branch filters for now.
    // Future: reintroduce when Teacher has branch relation.
    if (branchId || branchIds) {
      console.warn("Branch filter ignored: Teacher model lacks branchId field");
    }

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { teacherId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch teachers with pagination, selecting only needed fields
    const [teachers, totalCount] = await Promise.all([
      prisma.teacher.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          teacherId: true,
        },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const res = NextResponse.json({
      success: true,
      teachers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

    // Strong caching for performance
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    return res;
  } catch (error) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch teachers",
        teachers: [],
      },
      { status: 500 }
    );
  }
}