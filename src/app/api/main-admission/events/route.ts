import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");

    if (role !== "main_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const branchId = searchParams.get("branchId");

    const query: any = {};

    if (search) {
      query.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      query.status = status === "active" ? "ACTIVE" : "INACTIVE";
    }

    if (branchId) {
      query.branchId = parseInt(branchId);
    }

    const [events, count] = await prisma.$transaction([
      prisma.event.findMany({
        where: query,
        include: {},
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.event.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      events,
      count,
      page,
      totalPages: Math.ceil(count / ITEM_PER_PAGE),
    });
  } catch (error) {
    console.error("Main Admission events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");

    if (role !== "main_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      branchIds,
    } = body;

    if (!title || !description || !startTime || !endTime || !branchIds) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate that the branches exist
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds.map((id: string) => parseInt(id)) } },
    });

    if (branches.length !== branchIds.length) {
      return NextResponse.json(
        { error: "One or more invalid branch IDs" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        branchIds: branchIds.map((id: string) => parseInt(id)),
        isAllBranches: false,
        createdBy: "main_admission", // Add the required createdBy field
      },
      include: {},
    });

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
