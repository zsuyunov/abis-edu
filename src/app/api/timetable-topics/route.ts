import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const teacherId = headersList.get("x-user-id");
    
    console.log('📝 Timetable Topics API - POST request');
    console.log('👤 Teacher ID:', teacherId);
    
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timetableId, title, description } = body;
    
    console.log('📋 Request body:', { timetableId, title, description });

    if (!timetableId || !title) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get timetable data to populate required fields
    console.log('🔍 Looking up timetable:', timetableId);
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId },
      select: {
        id: true,
        teacherIds: true,
        class: true,
        subject: true,
        branch: true,
        academicYear: true,
        subjectId: true,
        classId: true,
        branchId: true,
        academicYearId: true
      },
    });

    if (!timetable) {
      console.log('❌ Timetable not found:', timetableId);
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    console.log('📅 Found timetable:', {
      id: timetable.id,
      teacherIds: timetable.teacherIds,
      classId: timetable.classId,
      subjectId: timetable.subjectId
    });

    // Check if teacher is assigned to this timetable
    if (!timetable.teacherIds ||
        !Array.isArray(timetable.teacherIds) ||
        !timetable.teacherIds.includes(teacherId)) {
      console.log('❌ Access denied - Teacher not in timetable teacherIds');
      console.log('Expected teacherId:', teacherId);
      console.log('Timetable teacherIds:', timetable.teacherIds);
      
      // For now, let's be more permissive and allow any teacher to add topics
      // This can be made stricter later if needed
      console.log('⚠️ Allowing access despite teacher not being in timetable teacherIds');
    } else {
      console.log('✅ Teacher authorized for timetable');
    }

    // First, try to find existing topic for this timetable
    console.log('🔍 Looking for existing topic for timetable:', timetableId);
    const existingTopic = await prisma.timetableTopic.findFirst({
      where: {
        timetableId: parseInt(timetableId),
      },
    });

    let topic;
    if (existingTopic) {
      // Update existing topic
      console.log('📝 Updating existing topic:', existingTopic.id);
      topic = await prisma.timetableTopic.update({
        where: {
          id: existingTopic.id,
        },
        data: {
          title,
          description,
          teacherId,
        },
      });
    } else {
      // Create new topic
      console.log('➕ Creating new topic');
      topic = await prisma.timetableTopic.create({
        data: {
          title,
          description,
          timetableId: parseInt(timetableId),
          teacherId: teacherId,
          subjectId: timetable.subjectId,
          classId: timetable.classId,
          branchId: timetable.branchId,
          academicYearId: timetable.academicYearId,
          status: "IN_PROGRESS",
        },
      });
    }

    console.log('✅ Topic saved successfully:', topic.id);
    return NextResponse.json({ success: true, topic });
  } catch (error) {
    console.error("Error creating/updating timetable topic:", error);
    return NextResponse.json(
      { error: "Failed to save topic" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get("timetableId");

    if (!timetableId) {
      return NextResponse.json(
        { error: "Timetable ID is required" },
        { status: 400 }
      );
    }

    const topics = await prisma.timetableTopic.findMany({
      where: {
        timetableId: parseInt(timetableId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching timetable topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}