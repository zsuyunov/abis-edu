import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = parseInt(params.id);
    const { comment, createdBy } = await request.json();

    if (!comment || comment.length < 10) {
      return NextResponse.json({ 
        error: "Comment is required (minimum 10 characters)" 
      }, { status: 400 });
    }

    // Check if exam has results
    const examWithResults = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examResults: true
      }
    });

    if (!examWithResults) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (examWithResults.examResults.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete exam with existing results. Archive it instead." 
      }, { status: 400 });
    }

    // Delete the exam with comment
    await prisma.$transaction(async (tx) => {
      // Create delete comment
      await tx.archiveComment.create({
        data: {
          examId: examId,
          comment: comment,
          action: "DELETE",
          createdBy: createdBy || 'admin',
        },
      });

      // Delete the exam
      await tx.exam.delete({
        where: { id: examId }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Exam deleted successfully" 
    });
  } catch (error) {
    console.error("Failed to delete exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 }
    );
  }
}

export const DELETE = withCSRF(deleteHandler);
