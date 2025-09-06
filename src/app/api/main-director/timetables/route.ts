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
        { subject: { name: { contains: search, mode: "insensitive" } } },
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [timetables, count] = await Promise.all([
      prisma.timetable.findMany({
        where: query,
        include: {
          subject: { select: { name: true } },
          teacher: { select: { firstName: true, lastName: true } },
          class: {
            select: {
              name: true,
              gradeLevel: { select: { level: true } },
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.timetable.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      data: timetables,
      pagination: {
        page,
        totalPages: Math.ceil(count / ITEM_PER_PAGE),
        totalItems: count,
        itemsPerPage: ITEM_PER_PAGE,
      },
    });
  } catch (error) {
    console.error("Main Director timetables API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
