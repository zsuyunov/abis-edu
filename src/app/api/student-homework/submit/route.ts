import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id');
    const url = new URL(request.url);
    const homeworkId = url.searchParams.get('homeworkId');

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 401 });
    }

    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        branch: true,
        class: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get homework details and verify access
    const homework = await prisma.homework.findUnique({
      where: { id: parseInt(homeworkId) },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teacherId: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileUrl: true,
            fileSize: true,
            duration: true,
            mimeType: true,
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Verify student access
    if (homework.branchId !== student.branchId || homework.classId !== student.classId) {
      return NextResponse.json({ error: "Access denied to this homework" }, { status: 403 });
    }

    // Get student's submission if it exists
    const submission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId: parseInt(homeworkId),
          studentId: studentId,
        },
      },
      include: {
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileType: true,
            fileUrl: true,
            fileSize: true,
            duration: true,
            mimeType: true,
          },
        },
      },
    });

    // Calculate submission status
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const isOverdue = now > dueDate;
    const hasSubmission = submission && submission.status !== "NOT_SUBMITTED";
    const canSubmit = !isOverdue || homework.allowLateSubmission;
    const submissionStatus = hasSubmission ? submission.status : "NOT_SUBMITTED";

    // Calculate time until due
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const hoursLeft = Math.ceil(timeDiff / (1000 * 3600));
    const timeUntilDue = isOverdue 
      ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`
      : daysLeft > 0 
        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
        : `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;

    return NextResponse.json({
      homework,
      submission,
      submissionDetails: {
        canSubmit: canSubmit && (!hasSubmission || submissionStatus === "SUBMITTED"),
        hasSubmission,
        submissionStatus,
        isOverdue,
        timeUntilDue,
      },
    });

  } catch (error) {
    console.error("Error fetching homework submission details:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework details" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id');
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract form fields
    const homeworkId = parseInt(formData.get('homeworkId') as string);
    const content = formData.get('content') as string;
    
    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        branch: true,
        class: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get homework details and verify access
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Verify student access
    if (homework.branchId !== student.branchId || homework.classId !== student.classId) {
      return NextResponse.json({ error: "Access denied to this homework" }, { status: 403 });
    }

    // Check if submission is allowed
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const isOverdue = now > dueDate;
    
    if (isOverdue && !homework.allowLateSubmission) {
      return NextResponse.json({ error: "Deadline has passed and late submissions are not allowed" }, { status: 400 });
    }

    // Create or update submission first
    const submissionData = {
      content: content || null,
      status: "SUBMITTED" as const,
      submissionDate: now,
      isLate: isOverdue,
    };

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId: homeworkId,
          studentId: studentId,
        },
      },
      update: submissionData,
      create: {
        homeworkId: homeworkId,
        studentId: studentId,
        ...submissionData,
      },
    });

    // Handle file uploads after submission is created
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'submissions', homeworkId.toString(), studentId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const attachments = [];

    // Process uploaded files
    const files = formData.getAll('files') as File[];
    for (const file of files) {
      if (file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);
        const fileName = `sub_${Date.now()}_${file.name}`;
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        
        const attachment = await prisma.submissionAttachment.create({
          data: {
            fileName: fileName,
            originalName: file.name,
            fileType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
            fileUrl: `/uploads/submissions/${homeworkId}/${studentId}/${fileName}`,
            filePath: filePath,
            fileSize: file.size,
            mimeType: file.type,
            submissionId: submission.id, // Now we have the submission ID
          },
        });
        attachments.push(attachment);
      }
    }

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        attachments,
      },
      message: `Homework submitted successfully${isOverdue ? ' (late submission)' : ''}`,
    });

  } catch (error) {
    console.error("Error submitting homework:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to submit homework" },
      { status: 500 }
    );
  }
}

export const POST = withCSRF(postHandler);

async function patchHandler(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id');
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 401 });
    }

    const { homeworkId, action, contentType, attachmentId } = await request.json();
    
    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { branch: true, class: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get homework details and verify access
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Verify student access
    if (homework.branchId !== student.branchId || homework.classId !== student.classId) {
      return NextResponse.json({ error: "Access denied to this homework" }, { status: 403 });
    }

    // Get existing submission
    const submission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId: homeworkId,
          studentId: studentId,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "No submission found" }, { status: 404 });
    }

    if (action === 'deleteContent' && contentType === 'text') {
      // Delete text content
      await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: { content: null },
      });

      return NextResponse.json({ success: true, message: "Text content removed successfully" });
    }

    if (action === 'deleteAttachment' && attachmentId) {
      // Delete specific attachment
      const attachment = await prisma.submissionAttachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment || attachment.submissionId !== submission.id) {
        return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
      }

      // Delete the attachment record
      await prisma.submissionAttachment.delete({
        where: { id: attachmentId },
      });

      return NextResponse.json({ success: true, message: "Attachment removed successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

export const PATCH = withCSRF(patchHandler);