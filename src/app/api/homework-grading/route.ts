import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Verify teacher owns this homework
    const homework = await prisma.homework.findFirst({
      where: {
        id: parseInt(homeworkId),
        teacherId: teacherId,
      },
      include: {
        class: {
          include: {
            students: true,
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found or access denied" }, { status: 404 });
    }

    // Get all students in the class
    const students = homework.class.students.map(student => ({
      id: student.id,
      fullName: `${student.firstName} ${student.lastName}`,
      isGraded: false, // Will be updated below
      grade: undefined,
      feedback: undefined,
    }));

    // Get all submissions for this homework
    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId: parseInt(homeworkId),
      },
      include: {
        attachments: true,
        student: true,
      },
    });

    // Transform submissions data
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id.toString(),
      studentId: submission.studentId,
      homeworkId: submission.homeworkId.toString(),
      content: submission.content || '',
      attachments: submission.attachments.map(att => ({
        id: att.id.toString(),
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        originalName: att.originalName || att.fileName,
        fileSize: att.fileSize || 0,
      })),
      submittedAt: submission.createdAt.toISOString(),
      grade: submission.grade,
      feedback: submission.feedback,
      isGraded: submission.grade !== null && submission.grade !== undefined,
    }));

    // Update students with grading status
    const studentsWithGrades = students.map(student => {
      const submission = transformedSubmissions.find(sub => sub.studentId === student.id);
      if (submission) {
        return {
          ...student,
          isGraded: submission.isGraded,
          grade: submission.grade,
          feedback: submission.feedback,
          submittedAt: submission.submittedAt,
        };
      }
      return student;
    });

    return NextResponse.json({
      success: true,
      students: studentsWithGrades,
      submissions: transformedSubmissions,
    });

  } catch (error) {
    console.error("Error fetching homework grading data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get("x-user-id");
    const body = await request.json();
    const { submissionId, grade, feedback } = body;

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    if (!submissionId || grade === undefined || grade === null) {
      return NextResponse.json({ error: "Submission ID and grade are required" }, { status: 400 });
    }

    if (grade < 0 || grade > 100) {
      return NextResponse.json({ error: "Grade must be between 0 and 100" }, { status: 400 });
    }

    // Verify teacher has access to this submission
    const submission = await prisma.homeworkSubmission.findFirst({
      where: {
        id: parseInt(submissionId),
        homework: {
          teacherId: teacherId,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found or access denied" }, { status: 404 });
    }

    // Update the submission with grade and feedback
    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: {
        id: parseInt(submissionId),
      },
      data: {
        grade: grade,
        feedback: feedback || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Grade and feedback submitted successfully",
      submission: {
        id: updatedSubmission.id.toString(),
        grade: updatedSubmission.grade,
        feedback: updatedSubmission.feedback,
        isGraded: updatedSubmission.grade !== null && updatedSubmission.grade !== undefined,
        gradedAt: updatedSubmission.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error("Error submitting grade:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
