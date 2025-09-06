import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "doctor" || !branchId) {
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

    const [announcements, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where })
    ]);

    return NextResponse.json({
      data: announcements,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching doctor announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "doctor" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, date } = await request.json();

    if (!title || !description || !date) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description,
        date: new Date(date),
        branchIds: [parseInt(branchId)],
        targetAudience: "ALL_USERS",
        createdBy: userId,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "doctor" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const announcementId = searchParams.get("id");

    if (!announcementId) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    // Check if the announcement belongs to the user's branch
    const announcement = await prisma.announcement.findFirst({
      where: {
        id: parseInt(announcementId),
        branchIds: {
          has: parseInt(branchId)
        },
        createdBy: userId
      }
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    await prisma.announcement.delete({
      where: { id: parseInt(announcementId) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
