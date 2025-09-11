import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Try both authorization header and x-user-id header for compatibility
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('x-user-id');
    
    let teacherId: string;
    
    if (authHeader) {
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      teacherId = session.id;
    } else if (userIdHeader) {
      teacherId = userIdHeader;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, grade, feedback } = body;

    // Validate input
    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    if (grade === undefined || grade === null) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 });
    }

    if (typeof grade !== 'number' || grade < 0 || grade > 100) {
      return NextResponse.json({ error: "Grade must be a number between 0 and 100" }, { status: 400 });
    }

    // Get submission and verify teacher ownership
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: parseInt(submissionId) },
      include: {
        homework: {
          include: {
            teacher: true,
            subject: true,
            class: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.homework.teacherId !== teacherId) {
      return NextResponse.json({ error: "Access denied. You can only grade your own homework assignments." }, { status: 403 });
    }

    // Check if submission is in a gradeable state
    if (submission.status === "NOT_SUBMITTED") {
      return NextResponse.json({ error: "Cannot grade a submission that hasn't been submitted" }, { status: 400 });
    }

    // Update submission with grade and feedback
    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: { id: parseInt(submissionId) },
      data: {
        grade: grade,
        feedback: feedback?.trim() || null,
        status: "GRADED",
      },
      include: {
        homework: {
          include: {
            subject: true,
            class: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: `Grade ${grade}% assigned to ${submission.student.firstName} ${submission.student.lastName}`,
    });

  } catch (error) {
    console.error("Error grading homework submission:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to grade submission" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try both authorization header and x-user-id header for compatibility
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('x-user-id');
    
    let teacherId: string;
    
    if (authHeader) {
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      teacherId = session.id;
    } else if (userIdHeader) {
      teacherId = userIdHeader;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const submissionId = url.searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Get submission details for grading
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: parseInt(submissionId) },
      include: {
        homework: {
          include: {
            teacher: true,
            subject: true,
            class: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
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

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.homework.teacherId !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      submission,
      gradingInfo: {
        canGrade: submission.status !== "NOT_SUBMITTED",
        isGraded: submission.status === "GRADED",
        currentGrade: submission.grade,
        currentFeedback: submission.feedback,
        maxPoints: submission.homework.totalPoints,
        isLateSubmission: submission.isLate,
        submissionDate: submission.submissionDate,
        dueDate: submission.homework.dueDate,
      },
    });

  } catch (error) {
    console.error("Error fetching submission for grading:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission details" },
      { status: 500 }
    );
  }
}
