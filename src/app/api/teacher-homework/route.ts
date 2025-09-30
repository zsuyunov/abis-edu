import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get("x-user-id");
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    console.log('🔍 API: Fetching homework for:', { teacherId, classId, subjectId });

    if (!teacherId) {
      console.log('❌ API: Teacher ID missing');
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    if (!classId || !subjectId) {
      console.log('❌ API: Class ID or Subject ID missing', { classId, subjectId });
      return NextResponse.json({ error: "Class ID and Subject ID are required" }, { status: 400 });
    }

    // Fetch homework for the specific class and subject
    const homework = await prisma.homework.findMany({
      where: {
        teacherId: teacherId,
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
      },
      include: {
        class: true,
        subject: true,
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('📊 API: Found homework records:', homework.length);

    // Transform homework data
    const transformedHomework = homework.map(hw => {
      // Determine status based on due date
      const now = new Date();
      let status: 'active' | 'completed' | 'overdue' = 'active';
      
      if (hw.dueDate < now) {
        status = 'overdue';
      }

      // Extract time from dueDate
      const dueTime = hw.dueDate.toTimeString().slice(0, 5); // HH:MM format
      const dueDate = hw.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const assignedDate = hw.assignedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      return {
      id: hw.id.toString(),
      title: hw.title,
      description: hw.description,
        assignedDate: assignedDate,
        dueDate: dueDate,
        dueTime: dueTime,
      className: hw.class.name,
      subjectName: hw.subject.name,
      attachments: hw.attachments.map(att => ({
          fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
          originalName: att.originalName,
        fileSize: att.fileSize,
      })),
      createdAt: hw.createdAt.toISOString(),
        status,
      };
    });

    console.log('✅ API: Returning homework data:', { count: transformedHomework.length, homework: transformedHomework });
    return NextResponse.json({ homework: transformedHomework });

  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get("x-user-id");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, instructions, startDate, startTime, dueDate, dueTime, totalMarks, passingMarks, classId, subjectId, attachments } = body;

    // Validate required fields
    if (!title || !description || !classId || !subjectId || !startDate || !dueDate) {
      return NextResponse.json({ 
        error: "Missing required fields: title, description, classId, subjectId, startDate, dueDate" 
      }, { status: 400 });
    }

    // Combine date and time for startDate and dueDate
    const startDateTime = new Date(`${startDate}T${startTime || '09:00'}`);
    const dueDateTime = new Date(`${dueDate}T${dueTime || '23:59'}`);

    // Create homework
    const homework = await prisma.homework.create({
      data: {
        title,
        description,
        instructions: instructions || '',
        assignedDate: startDateTime,
        dueDate: dueDateTime,
        totalPoints: totalMarks ? parseFloat(totalMarks) : null,
        passingGrade: passingMarks ? parseFloat(passingMarks) : null,
        teacherId,
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        academicYearId: 1, // Default academic year
        branchId: 1, // Default branch
        attachments: {
          create: attachments?.map((att: any) => {
            // Map file types to AttachmentType enum
            let attachmentType = 'OTHER';
            if (att.fileType.startsWith('image/')) {
              attachmentType = 'IMAGE';
            } else if (att.fileType.startsWith('audio/')) {
              attachmentType = 'AUDIO';
            } else if (att.fileType.startsWith('video/')) {
              attachmentType = 'VIDEO';
            } else if (att.fileType === 'text/plain' || att.fileType === 'text/html') {
              attachmentType = 'TEXT';
            } else if (att.fileType.includes('pdf') || att.fileType.includes('document') || att.fileType.includes('sheet') || att.fileType.includes('presentation')) {
              attachmentType = 'DOCUMENT';
            }

            return {
              fileName: att.fileName,
              originalName: att.fileName, // Use fileName as originalName
              fileUrl: att.fileUrl,
              filePath: att.fileUrl, // Use fileUrl as filePath
              fileType: attachmentType,
              mimeType: att.fileType, // Use actual MIME type
              fileSize: att.fileSize || 0,
            };
          }) || [],
        },
      },
      include: {
        class: true,
        subject: true,
        attachments: true,
      },
    });

    // Extract time from dueDate for response
    const responseDueTime = homework.dueDate.toTimeString().slice(0, 5); // HH:MM format
    const responseDueDate = homework.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    return NextResponse.json({
      success: true,
      homework: {
        id: homework.id.toString(),
        title: homework.title,
        description: homework.description,
        dueDate: responseDueDate,
        dueTime: responseDueTime,
        className: homework.class.name,
        subjectName: homework.subject.name,
        attachments: homework.attachments.map(att => ({
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
        })),
        createdAt: homework.createdAt.toISOString(),
        status: 'active',
      }
    });

  } catch (error) {
    console.error("Error creating homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const teacherId = request.headers.get("x-user-id");
    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get("homeworkId");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Check if homework exists and belongs to the teacher
    const existingHomework = await prisma.homework.findFirst({
      where: {
        id: parseInt(homeworkId),
        teacherId: teacherId,
      },
    });

    if (!existingHomework) {
      return NextResponse.json({ error: "Homework not found or access denied" }, { status: 404 });
    }

    // Delete homework (cascade will handle attachments)
    await prisma.homework.delete({
      where: {
        id: parseInt(homeworkId),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Homework deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}