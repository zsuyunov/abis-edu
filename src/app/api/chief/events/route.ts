import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "chief" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = {
      branchIds: {
        has: parseInt(branchId)
      }
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
      }),
      prisma.event.count({ where })
    ]);

    return NextResponse.json({
      data: events,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching chief events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "chief" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, startTime, endTime } = await request.json();

    if (!title || !description || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        branchIds: [parseInt(branchId)],
        targetAudience: "ALL_USERS",
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "chief" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Check if the event belongs to the user's branch
    const event = await prisma.event.findFirst({
      where: {
        id: parseInt(eventId),
        branchIds: {
          has: parseInt(branchId)
        },
        createdBy: userId
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({
      where: { id: parseInt(eventId) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
