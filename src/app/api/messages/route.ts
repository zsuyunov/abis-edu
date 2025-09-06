import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, inbox, outbox, unread
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let whereClause: any = {};

    switch (type) {
      case "inbox":
        whereClause.receiverId = userId;
        break;
      case "outbox":
        whereClause.senderId = userId;
        break;
      case "unread":
        whereClause = {
          receiverId: userId,
          status: { in: ["SENT", "DELIVERED"] }
        };
        break;
      default:
        whereClause = {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            position: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            position: true,
          },
        },
        branch: {
          select: {
            id: true,
            shortName: true,
          },
        },
        attachments: true,
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: whereClause,
    });

    return NextResponse.json({
      messages,
      totalCount,
      hasMore: totalCount > offset + limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      senderId,
      receiverId,
      branchId,
      role,
      subject,
      body: messageBody,
      attachments = []
    } = body;

    // Validate required fields
    if (!senderId || !receiverId || !subject || !messageBody || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create message with attachments in transaction
    const message = await prisma.$transaction(async (tx) => {
      // Create the message
      const newMessage = await tx.message.create({
        data: {
          senderId,
          receiverId,
          branchId: branchId || null,
          role,
          subject,
          body: messageBody,
          status: "SENT",
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userId: true,
              position: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userId: true,
              position: true,
            },
          },
          branch: {
            select: {
              id: true,
              shortName: true,
            },
          },
        },
      });

      // Create attachments if any
      if (attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: attachments.map((attachment: any) => ({
            messageId: newMessage.id,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          })),
        });

        // Fetch attachments to include in response
        const messageAttachments = await tx.messageAttachment.findMany({
          where: { messageId: newMessage.id },
        });

        return { ...newMessage, attachments: messageAttachments };
      }

      return { ...newMessage, attachments: [] };
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
