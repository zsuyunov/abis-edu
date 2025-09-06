import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { timetableTopicSchema } from "@/lib/formValidationSchemas";

// Remove the local AuthService class since we're importing it

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId") || session.id;
    const timetableId = url.searchParams.get("timetableId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    // Build filter conditions
    const where: any = {};

    // Teachers can only see their own topics
    where.teacherId = teacherId;

    if (timetableId) where.timetableId = parseInt(timetableId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (status) where.status = status;

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const topics = await prisma.timetableTopic.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ topics });

  } catch (error) {
    console.error("Error fetching timetable topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const data = timetableTopicSchema.parse(body);

    // Verify teacher has permission to create topic for this timetable
    const timetable = await prisma.timetable.findUnique({
      where: { id: data.timetableId },
    });

    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    // Check if teacher is assigned to this timetable
    const canCreateTopic = timetable.teacherId === session.id;

    if (!canCreateTopic) {
      return NextResponse.json({ 
        error: "You don't have permission to create topics for this timetable" 
      }, { status: 403 });
    }

    // Set teacher ID to current user
    data.teacherId = session.id;

    // Auto-complete required fields from timetable
    data.classId = timetable.classId;
    data.subjectId = timetable.subjectId;
    data.branchId = timetable.branchId;
    data.academicYearId = timetable.academicYearId;

    // Set completion date if status is completed
    if (data.status === "COMPLETED" && !data.completedAt) {
      data.completedAt = new Date();
    }

    const topic = await prisma.timetableTopic.create({
      data: {
        title: data.title,
        description: data.description || null,
        attachments: data.attachments || [],
        timetableId: data.timetableId,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId,
        branchId: data.branchId,
        academicYearId: data.academicYearId,
        status: data.status,
        progressPercentage: data.progressPercentage,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
      },
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

    return NextResponse.json({ topic }, { status: 201 });

  } catch (error) {
    console.error("Error creating timetable topic:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create timetable topic" },
      { status: 500 }
    );
  }
}
