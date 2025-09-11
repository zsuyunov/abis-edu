import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = parseInt(params.id);

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

    // Delete the exam
    await prisma.exam.delete({
      where: { id: examId }
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
