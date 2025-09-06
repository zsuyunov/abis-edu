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
    const type = searchParams.get("type") || "inbox";
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const limit = 10;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (type === "inbox") {
      where.receiverId = userId;
    } else if (type === "sent") {
      where.senderId = userId;
    } else if (type === "unread") {
      where.receiverId = userId;
      where.status = "SENT";
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } }
      ];
    }

    const [messages, total] = await prisma.$transaction([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              position: true,
              userId: true
            }
          },
          receiver: {
            select: {
              firstName: true,
              lastName: true,
              position: true,
              userId: true
            }
          },
          branch: {
            select: {
              shortName: true
            }
          },
          _count: {
            select: {
              attachments: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where })
    ]);

    return NextResponse.json({
      data: messages,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching chief messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
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

    const { recipient, subject, body } = await request.json();

    if (!recipient || !subject || !body) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Find recipient by phone or email
    let receiverId = null;
    
    // Try to find by phone first
    const userByPhone = await prisma.user.findUnique({
      where: { phone: recipient }
    });
    
    if (userByPhone) {
      receiverId = userByPhone.id;
    } else {
      // Try to find by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: recipient }
      });
      
      if (userByEmail) {
        receiverId = userByEmail.id;
      }
    }

    if (!receiverId) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        branchId: parseInt(branchId),
        role: "CHIEF",
        subject,
        body,
        status: "SENT",
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
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
    const messageId = searchParams.get("id");

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    // Check if the message belongs to the user
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.message.delete({
      where: { id: parseInt(messageId) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
