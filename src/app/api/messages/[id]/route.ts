import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id },
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
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    const { status, readAt } = body;

    // Update message status (usually for marking as read)
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(readAt && { readAt: new Date(readAt) }),
        ...(status === "READ" && !readAt && { readAt: new Date() }),
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
        attachments: true,
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    // Delete message and attachments in transaction
    await prisma.$transaction(async (tx) => {
      // Delete attachments first
      await tx.messageAttachment.deleteMany({
        where: { messageId: id },
      });

      // Delete the message
      await tx.message.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
