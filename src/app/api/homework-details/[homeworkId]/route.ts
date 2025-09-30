import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { homeworkId: string } }
) {
  try {
    const teacherId = request.headers.get("x-user-id");
    const homeworkId = params.homeworkId;

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    if (!homeworkId) {
      return NextResponse.json({ error: "Homework ID is required" }, { status: 400 });
    }

    // Fetch homework details
    const homework = await prisma.homework.findFirst({
      where: {
        id: parseInt(homeworkId),
        teacherId: teacherId,
      },
      include: {
        class: true,
        subject: true,
      },
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      homework: {
        id: homework.id.toString(),
        title: homework.title,
        className: homework.class.name,
        subjectName: homework.subject.name,
      },
    });

  } catch (error) {
    console.error("Error fetching homework details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
