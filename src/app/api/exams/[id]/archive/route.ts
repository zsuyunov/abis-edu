import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = parseInt(params.id);
    const { action, comment, createdBy } = await request.json();

    if (action !== 'archive') {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!comment || comment.length < 10) {
      return NextResponse.json({ 
        error: "Comment is required (minimum 10 characters)" 
      }, { status: 400 });
    }

    // Archive the exam with comment
    await prisma.$transaction(async (tx) => {
      // Update exam status
      await tx.exam.update({
        where: { id: examId },
        data: {
          archivedAt: new Date(),
          status: "CANCELLED"
        }
      });

      // Create archive comment
      await tx.archiveComment.create({
        data: {
          examId: examId,
          comment: comment,
          action: "ARCHIVE",
          createdBy: createdBy || 'admin',
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Exam archived successfully"
    });
  } catch (error) {
    console.error("Failed to archive exam:", error);
    return NextResponse.json(
      { error: "Failed to archive exam" },
      { status: 500 }
    );
  }
}
