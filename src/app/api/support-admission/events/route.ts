import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userBranchId = headersList.get("x-branch-id");

    if (role !== "support_admission" || !userBranchId) {
      return NextResponse.json(
        { error: "Unauthorized - Support Admission access required or branch ID missing" },
        { status: 403 }
      );
    }

    const branchId = parseInt(userBranchId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Event model uses isAllBranches + branchIds (Int[]) in schema.
    // We will fetch events that are for all branches OR contain the user's branchId.
    const baseWhere: any = {
      OR: [
        { isAllBranches: true },
        { branchIds: { has: branchId } },
      ],
    };

    if (search) {
      baseWhere.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }
    // status is not present on Event schema; ignore filter safely

    const [eventsRaw, count] = await prisma.$transaction([
      prisma.event.findMany({
        where: baseWhere,
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          createdAt: true,
        },
      }),
      prisma.event.count({ where: baseWhere }),
    ]);

    // Map to UI shape expected by components
    const events = eventsRaw.map((e) => ({
      id: String(e.id),
      title: e.title,
      description: e.description,
      startDate: e.startTime,
      endDate: e.endTime,
      location: "",
      status: "ACTIVE",
      createdAt: e.createdAt,
    }));

    return NextResponse.json({
      success: true,
      events,
      count,
      page,
      totalPages: Math.ceil(count / ITEM_PER_PAGE),
    });
  } catch (error) {
    console.error("Support Admission events error:", error);
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
    const userBranchId = headersList.get("x-branch-id");

    if (role !== "support_admission" || !userBranchId) {
      return NextResponse.json(
        { error: "Unauthorized - Support Admission access required or branch ID missing" },
        { status: 403 }
      );
    }

    const assignedBranchId = parseInt(userBranchId);

    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      priority = "MEDIUM",
    } = body;

    if (!title || !description || !startDate || !endDate || !location) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        branchId: assignedBranchId, // CRITICAL: Always use assigned branch
        priority,
        status: "ACTIVE",
      },
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
