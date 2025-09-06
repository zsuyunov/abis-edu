import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");

    // Check if user is main director
    if (role !== "main_director") {
      return NextResponse.json(
        { error: "Unauthorized - Main Director access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";

    // Build query
    const query: any = {};
    if (search) {
      query.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { gradeLevel: { level: { equals: parseInt(search) || 0 } } },
      ];
    }

    const [classes, count] = await Promise.all([
      prisma.class.findMany({
        where: query,
        include: {
          gradeLevel: { select: { level: true } },
          branch: { select: { shortName: true } },
          academicYear: { select: { name: true } },
          _count: {
            select: {
              students: true,
              timetables: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.class.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      data: classes,
      pagination: {
        page,
        totalPages: Math.ceil(count / ITEM_PER_PAGE),
        totalItems: count,
        itemsPerPage: ITEM_PER_PAGE,
      },
    });
  } catch (error) {
    console.error("Main Director classes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
