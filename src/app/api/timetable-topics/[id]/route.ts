import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { timetableTopicSchema } from "@/lib/formValidationSchemas";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topicId = parseInt(params.id);
    if (isNaN(topicId)) {
      return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
    }

    const topic = await prisma.timetableTopic.findUnique({
      where: { id: topicId },
      include: {
        timetable: {
          include: {
            class: true,
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        class: true,
        subject: true,
        branch: true,
        academicYear: true,
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Check permissions - teacher can view their own topics
    const canView = topic.teacherId === session.id;

    if (!canView) {
      return NextResponse.json({ 
        error: "You don't have permission to view this topic" 
      }, { status: 403 });
    }

    return NextResponse.json({ topic });

  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topicId = parseInt(params.id);
    if (isNaN(topicId)) {
      return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
    }

    const body = await request.json();
    const data = timetableTopicSchema.parse(body);

    // Get existing topic with permissions check
    const existingTopic = await prisma.timetableTopic.findUnique({
      where: { id: topicId },
      include: {
        timetable: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!existingTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Only the teacher who created the topic can edit it
    if (existingTopic.teacherId !== session.id) {
      return NextResponse.json({ 
        error: "You can only edit your own topics" 
      }, { status: 403 });
    }

    // Update topic data
    const updateData: any = {
      title: data.title,
      description: data.description || null,
      status: data.status,
    };

    const topic = await prisma.timetableTopic.update({
      where: { id: topicId },
      data: updateData,
      include: {
        timetable: {
          include: {
            class: true,
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        class: true,
        subject: true,
      },
    });

    return NextResponse.json({ topic });

  } catch (error) {
    console.error("Error updating topic:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topicId = parseInt(params.id);
    if (isNaN(topicId)) {
      return NextResponse.json({ error: "Invalid topic ID" }, { status: 400 });
    }

    // Get existing topic with permissions check
    const existingTopic = await prisma.timetableTopic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!existingTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Only the teacher who created the topic can delete it
    if (existingTopic.teacherId !== session.id) {
      return NextResponse.json({ 
        error: "You can only delete your own topics" 
      }, { status: 403 });
    }

    await prisma.timetableTopic.delete({
      where: { id: topicId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
