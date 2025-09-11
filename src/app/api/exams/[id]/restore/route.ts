import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = parseInt(params.id);
    const { action } = await request.json();

    if (action !== 'restore') {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Restore the exam
    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        archivedAt: null,
        restoredAt: new Date(),
        status: "SCHEDULED"
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Exam restored successfully",
      exam 
    });
  } catch (error) {
    console.error("Failed to restore exam:", error);
    return NextResponse.json(
      { error: "Failed to restore exam" },
      { status: 500 }
    );
  }
}
