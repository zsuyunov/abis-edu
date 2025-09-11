import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = parseInt(params.id);
    const { action } = await request.json();

    if (action !== 'archive') {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Archive the exam
    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        archivedAt: new Date(),
        status: "CANCELLED"
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Exam archived successfully",
      exam 
    });
  } catch (error) {
    console.error("Failed to archive exam:", error);
    return NextResponse.json(
      { error: "Failed to archive exam" },
      { status: 500 }
    );
  }
}
