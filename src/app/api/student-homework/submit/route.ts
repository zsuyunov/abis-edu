import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { homeworkSubmissionSchema } from "@/lib/formValidationSchemas";

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
    const studentId = session.id;

    // Validate submission data
    const validatedData = homeworkSubmissionSchema.parse({
      ...body,
      studentId,
    });

    // Get student information to verify branch and class access
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        branch: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get homework details and verify student access
    const homework = await prisma.homework.findUnique({
      where: { id: validatedData.homeworkId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Verify student can submit to this homework (branch and class match)
    if (homework.branchId !== student.branchId || homework.classId !== student.classId) {
      return NextResponse.json({ error: "Access denied to this homework" }, { status: 403 });
    }

    // Check if homework is still active
    if (homework.status !== "ACTIVE") {
      return NextResponse.json({ error: "This homework is no longer accepting submissions" }, { status: 400 });
    }

    // Check deadline (allow late submissions if configured)
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    const isLate = now > dueDate;

    if (isLate && !homework.allowLateSubmission) {
      return NextResponse.json({ 
        error: "Deadline has passed and late submissions are not allowed" 
      }, { status: 400 });
    }

    // Check if submission already exists
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId: validatedData.homeworkId,
          studentId: studentId,
        },
      },
    });

    const submissionData = {
      content: validatedData.content || "",
      submissionDate: new Date(),
      status: "SUBMITTED" as const,
      isLate,
    };

    let submission;

    if (existingSubmission) {
      // Update existing submission (allow resubmission until deadline)
      if (existingSubmission.status === "GRADED") {
        return NextResponse.json({ 
          error: "Cannot resubmit homework that has already been graded" 
        }, { status: 400 });
      }

      submission = await prisma.homeworkSubmission.update({
        where: { id: existingSubmission.id },
        data: submissionData,
        include: {
          homework: {
            include: {
              subject: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
        },
      });
    } else {
      // Create new submission
      submission = await prisma.homeworkSubmission.create({
        data: {
          ...submissionData,
          homeworkId: validatedData.homeworkId,
          studentId: studentId,
        },
        include: {
          homework: {
            include: {
              subject: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
        },
      });
    }

    // Handle attachments if provided
    if (validatedData.attachments && validatedData.attachments.length > 0) {
      // Delete existing attachments if updating
      if (existingSubmission) {
        await prisma.submissionAttachment.deleteMany({
          where: { submissionId: submission.id },
        });
      }

      // Create new attachments
      await prisma.submissionAttachment.createMany({
        data: validatedData.attachments.map(attachment => ({
          ...attachment,
          submissionId: submission.id,
        })),
      });
    }

    // Get updated submission with attachments
    const finalSubmission = await prisma.homeworkSubmission.findUnique({
      where: { id: submission.id },
      include: {
        attachments: true,
        homework: {
          include: {
            subject: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      submission: finalSubmission,
      message: isLate 
        ? `Homework submitted successfully (late submission)`
        : `Homework submitted successfully`,
      isUpdate: !!existingSubmission,
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
    const studentId = session.id;
    const homeworkId = url.searchParams.get("homeworkId");

    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        branch: true,
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
    const canSubmit = homework.status === "ACTIVE" && (!isOverdue || homework.allowLateSubmission);
    const canResubmit = submission && submission.status !== "GRADED" && canSubmit;

    return NextResponse.json({
      homework,
      submission,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class,
        branch: student.branch,
      },
      submissionDetails: {
        canSubmit,
        canResubmit,
        isOverdue,
        hasSubmission: !!submission,
        submissionStatus: submission?.status || "NOT_SUBMITTED",
        daysUntilDue: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        timeUntilDue: getTimeUntilDue(dueDate),
      },
    });

  } catch (error) {
    console.error("Error getting homework submission details:", error);
    return NextResponse.json(
      { error: "Failed to get homework details" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const studentId = session.id;
    const submissionId = url.searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Get submission and verify ownership
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: parseInt(submissionId) },
      include: {
        homework: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.studentId !== studentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if submission can be deleted (not graded and within resubmission window)
    if (submission.status === "GRADED") {
      return NextResponse.json({ 
        error: "Cannot delete graded submission" 
      }, { status: 400 });
    }

    const now = new Date();
    const dueDate = new Date(submission.homework.dueDate);
    const canModify = submission.homework.status === "ACTIVE" && 
                      (now <= dueDate || submission.homework.allowLateSubmission);

    if (!canModify) {
      return NextResponse.json({ 
        error: "Cannot delete submission after deadline" 
      }, { status: 400 });
    }

    // Delete attachments first (cascade should handle this, but being explicit)
    await prisma.submissionAttachment.deleteMany({
      where: { submissionId: submission.id },
    });

    // Reset submission to NOT_SUBMITTED state instead of deleting
    await prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: {
        content: null,
        submissionDate: null,
        status: "NOT_SUBMITTED",
        isLate: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Submission removed successfully. You can submit again if needed.",
    });

  } catch (error) {
    console.error("Error deleting homework submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}

// Helper functions
function getTimeUntilDue(dueDate: Date) {
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return "Overdue";
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}
