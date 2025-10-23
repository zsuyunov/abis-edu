import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma, { withPrismaRetry } from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import { withConnection } from "@/lib/dbConnection";

async function postHandler(request: NextRequest) {
  try {
    const teacherId = request.headers.get("x-user-id");
    
    if (!teacherId) {
      console.log('❌ Unauthorized: No teacher ID provided');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timetableId, title, description } = body;
    
    // Only log in development
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.log('📝 Creating/updating topic:', { timetableId, title, teacherId });
    }

    if (!timetableId || !title) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get timetable data to populate required fields
    const timetable = await withPrismaRetry(() => prisma.timetable.findUnique({
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
    }));

    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    // Check if teacher is assigned to this timetable
    if (!timetable.teacherIds ||
        !Array.isArray(timetable.teacherIds) ||
        !timetable.teacherIds.includes(teacherId)) {
      
      // For now, let's be more permissive and allow any teacher to add topics
      // This can be made stricter later if needed
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.log('⚠️ Teacher not assigned to timetable, but allowing topic creation');
      }
    } else {
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.log('✅ Teacher is assigned to timetable');
      }
    }

    // First, try to find existing topic for this timetable
    const existingTopic = await withPrismaRetry(() => prisma.timetableTopic.findFirst({
      where: {
        timetableId: parseInt(timetableId),
      },
    }));

    let topic;
    if (existingTopic) {
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.log('🔄 Updating existing topic:', existingTopic.id);
      }
      // Update existing topic
      topic = await withPrismaRetry(() => prisma.timetableTopic.update({
        where: {
          id: existingTopic.id,
        },
        data: {
          title,
          description,
          teacherId,
        },
      }));
    } else {
      // Only create topics for timetables with a classId (not elective timetables)
      if (!timetable.classId) {
        return NextResponse.json({
          error: 'Cannot create topics for elective timetables without a specific class'
        }, { status: 400 });
      }

      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.log('✨ Creating new topic');
      }
      // Create new topic
      topic = await withPrismaRetry(() => prisma.timetableTopic.create({
        data: {
          title,
          description,
          timetableId: parseInt(timetableId),
          teacherId: teacherId,
          subjectId: timetable.subjectId,
          classId: timetable.classId!,
          branchId: timetable.branchId!,
          academicYearId: timetable.academicYearId!,
          status: "IN_PROGRESS",
        },
      }));
    }

    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.log('✅ Topic saved successfully:', topic.id);
    }
    return NextResponse.json({ 
      success: true, 
      message: existingTopic ? 'Topic updated successfully' : 'Topic created successfully',
      topic 
    });
  } catch (error) {
    console.error("Error creating/updating timetable topic:", error);
    return NextResponse.json(
      { error: "Failed to save topic" },
      { status: 500 }
    );
  }
}

export const POST = authenticateJWT(authorizeRole('TEACHER')(withCSRF(withConnection(postHandler))));

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

    const topics = await withPrismaRetry(() => prisma.timetableTopic.findMany({
      where: {
        timetableId: parseInt(timetableId),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
          }
        },
        class: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            shortName: true,
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching timetable topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}