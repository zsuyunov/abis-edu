import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    // Try header-based auth first, then fallback to token auth
    const teacherId = request.headers.get('x-user-id');
    let authenticatedUserId = teacherId;

    if (!teacherId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const instructions = formData.get('instructions') as string;
    const totalPoints = parseInt(formData.get('totalPoints') as string) || 0;
    const passingPoints = parseInt(formData.get('passingPoints') as string) || 0;
    const assignedDate = formData.get('assignedDate') as string;
    const dueDate = formData.get('dueDate') as string;
    const allowLateSubmission = formData.get('allowLateSubmission') === 'true';
    const latePenaltyPerDay = parseInt(formData.get('latePenaltyPerDay') as string) || 0;
    const classId = parseInt(formData.get('classId') as string);
    const subjectId = parseInt(formData.get('subjectId') as string);
    const branchId = parseInt(formData.get('branchId') as string);

    // Validate required fields
    if (!title || !dueDate || !classId || !subjectId || !branchId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: authenticatedUserId || undefined },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Create homework
    console.log('Creating homework with data:', {
      title,
      description,
      instructions,
      assignedDate: new Date(assignedDate),
      dueDate: new Date(dueDate),
      branchId,
      classId,
      subjectId,
      teacherId: authenticatedUserId,
    });
    
    console.log('API Debug - Header teacherId:', teacherId);
    console.log('API Debug - Authenticated userId:', authenticatedUserId);
    console.log('API Debug - Final teacherId being used for creation:', authenticatedUserId);
    console.log('API Debug - TeacherId type:', typeof authenticatedUserId);
    console.log('API Debug - TeacherId value:', JSON.stringify(authenticatedUserId));

    // Get the academic year from the class that the homework is being assigned to
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { academicYearId: true }
    });

    let academicYearId = 1; // Default fallback

    if (targetClass) {
      // Use the academic year from the target class
      academicYearId = targetClass.academicYearId;
      console.log('Using academic year from target class:', academicYearId);
    } else {
      // Fallback: Get the current academic year
      const currentAcademicYear = await prisma.academicYear.findFirst({
        where: {
          isCurrent: true,
          status: 'ACTIVE'
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      if (currentAcademicYear) {
        academicYearId = currentAcademicYear.id;
        console.log('Using current academic year:', academicYearId);
      } else {
        console.log('Using default academic year:', academicYearId);
      }
    }

    // Double-check that this academic year actually exists
    const verifyAcademicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true, name: true, isCurrent: true }
    });
    console.log('Verified academic year exists:', verifyAcademicYear);

    // Also check if academic year 2 exists (the one the fetch expects)
    const academicYear2 = await prisma.academicYear.findUnique({
      where: { id: 2 },
      select: { id: true, name: true, isCurrent: true }
    });
    console.log('Academic year 2 exists:', academicYear2);

    console.log('Creating homework with academicYearId:', academicYearId, 'branchId:', branchId);

    const homework = await prisma.homework.create({
      data: {
        title,
        description: description || null,
        instructions: instructions || null,
        assignedDate: new Date(assignedDate),
        dueDate: new Date(dueDate),
        status: 'ACTIVE',
        totalPoints: totalPoints || null,
        passingGrade: passingPoints || null,
        allowLateSubmission,
        latePenalty: latePenaltyPerDay || null,
        branchId,
        academicYearId: academicYearId,
        classId,
        subjectId,
        teacherId: authenticatedUserId!,
      },
    });

    console.log('Homework created successfully:', {
      id: homework.id,
      academicYearId: homework.academicYearId,
      branchId: homework.branchId,
      teacherId: homework.teacherId,
    });

    console.log('Homework created successfully:', {
      id: homework.id,
      title: homework.title,
      academicYearId: homework.academicYearId,
      branchId: homework.branchId,
      teacherId: homework.teacherId
    });

        // Handle file uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'homework', homework.id.toString());
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const attachments = [];

    // Process images
    const imageFiles = formData.getAll('images') as File[];
    for (const file of imageFiles) {
      if (file.size > 0) {
        const fileName = `img_${Date.now()}_${file.name}`;
        
        // Save file to filesystem
        const filePath = path.join(uploadDir, fileName);
        const fileBuffer = new Uint8Array(await file.arrayBuffer());
        await writeFile(filePath, fileBuffer);
        
        const attachment = await prisma.homeworkAttachment.create({
          data: {
            homeworkId: homework.id,
            fileName: fileName,
            originalName: file.name,
            fileType: 'IMAGE',
            fileUrl: `/uploads/homework/${homework.id}/${fileName}`,
            filePath: `/uploads/homework/${homework.id}/${fileName}`,
            fileSize: file.size,
            mimeType: file.type,
          },
        });
        attachments.push(attachment);
      }
    }

    // Process files
    const documentFiles = formData.getAll('files') as File[];
    for (const file of documentFiles) {
      if (file.size > 0) {
        const fileName = `doc_${Date.now()}_${file.name}`;
        
        // Save file to filesystem
        const filePath = path.join(uploadDir, fileName);
        const fileBuffer = new Uint8Array(await file.arrayBuffer());
        await writeFile(filePath, fileBuffer);
        
        const attachment = await prisma.homeworkAttachment.create({
          data: {
            homeworkId: homework.id,
            fileName: fileName,
            originalName: file.name,
            fileType: 'DOCUMENT',
            fileUrl: `/uploads/homework/${homework.id}/${fileName}`,
            filePath: `/uploads/homework/${homework.id}/${fileName}`,
            fileSize: file.size,
            mimeType: file.type,
          },
        });
        attachments.push(attachment);
      }
    }

    // Process voice messages
    const voiceFiles = formData.getAll('voiceMessages') as File[];
    for (const file of voiceFiles) {
      if (file.size > 0) {
        const fileName = `voice_${Date.now()}_${file.name}`;
        
        // Create directory for this homework if it doesn't exist
        const homeworkDir = path.join(process.cwd(), 'public', 'uploads', 'homework', homework.id.toString());
        if (!existsSync(homeworkDir)) {
          await mkdir(homeworkDir, { recursive: true });
        }
        
        // Save file to filesystem
        const filePath = path.join(homeworkDir, fileName);
        const fileBuffer = new Uint8Array(await file.arrayBuffer());
        await writeFile(filePath, fileBuffer);
        
        const attachment = await prisma.homeworkAttachment.create({
          data: {
            homeworkId: homework.id,
            fileName: fileName,
            originalName: file.name,
            fileType: 'AUDIO',
            fileUrl: `/uploads/homework/${homework.id}/${fileName}`,
            filePath: `/uploads/homework/${homework.id}/${fileName}`,
            fileSize: file.size,
            mimeType: file.type,
          },
        });
        attachments.push(attachment);
      }
    }

    // Create submission records for all students in the class
    const studentsInClass = await prisma.student.findMany({
      where: {
        classId: classId,
        branchId: branchId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (studentsInClass.length > 0) {
      await prisma.homeworkSubmission.createMany({
        data: studentsInClass.map(student => ({
          homeworkId: homework.id,
          studentId: student.id,
          status: "NOT_SUBMITTED",
        })),
      });
    }

    return NextResponse.json({
      success: true,
      homework: {
        ...homework,
        attachments,
      },
      message: `Homework "${homework.title}" created successfully with ${attachments.length} attachments for ${studentsInClass.length} students`,
    });

  } catch (error) {
    console.error("Error creating homework with files:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create homework" },
      { status: 500 }
    );
  }
}
