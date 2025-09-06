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
    const priority = searchParams.get("priority") || "";

    const query: any = {};

    if (search) {
      query.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (priority) {
      query.priority = priority.toUpperCase();
    }

    if (branchId) {
      query.branchId = parseInt(branchId);
    }

    const [messages, count] = await prisma.$transaction([
      prisma.message.findMany({
        where: query,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              position: true,
            },
          },
          recipients: {
            select: {
              firstName: true,
              lastName: true,
              position: true,
              branchId: true,
              branch: {
                select: {
                  shortName: true,
                },
              },
            },
          },
          branch: {
            select: {
              shortName: true,
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      count,
      page,
      totalPages: Math.ceil(count / ITEM_PER_PAGE),
    });
  } catch (error) {
    console.error("Main Admission messages error:", error);
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
    const userId = headersList.get("x-user-id");

    if (role !== "main_admission" || !userId) {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      subject,
      content,
      recipientIds,
      branchId,
      priority = "MEDIUM",
    } = body;

    if (!subject || !content || !recipientIds || !branchId) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate that the branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(branchId) },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Invalid branch ID" },
        { status: 400 }
      );
    }

    // Validate recipients exist
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: recipientIds },
      },
    });

    if (recipients.length !== recipientIds.length) {
      return NextResponse.json(
        { error: "Some recipients not found" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        subject,
        content,
        senderId: userId,
        branchId: parseInt(branchId),
        priority,
        status: "SENT",
        recipients: {
          connect: recipientIds.map((id: string) => ({ id })),
        },
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        recipients: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
            branchId: true,
            branch: {
              select: {
                shortName: true,
              },
            },
          },
        },
        branch: {
          select: {
            shortName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      message: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
