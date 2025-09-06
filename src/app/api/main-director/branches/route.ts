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
        { shortName: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }

    const [branches, count] = await Promise.all([
      prisma.branch.findMany({
        where: query,
        include: {
          director: { select: { firstName: true, lastName: true } },
          _count: {
            select: {
              teachers: true,
              students: true,
              classes: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.branch.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      data: branches,
      pagination: {
        page,
        totalPages: Math.ceil(count / ITEM_PER_PAGE),
        totalItems: count,
        itemsPerPage: ITEM_PER_PAGE,
      },
    });
  } catch (error) {
    console.error("Main Director branches API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
