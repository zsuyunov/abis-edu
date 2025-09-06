import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Check if teacherId exists in any user type
    const [existingTeacher, existingUser, existingParent, existingStudent] = await Promise.all([
      prisma.teacher.findFirst({ where: { teacherId } }),
      prisma.user.findFirst({ where: { userId: teacherId } }),
      prisma.parent.findFirst({ where: { parentId: teacherId } }),
      prisma.student.findFirst({ where: { studentId: teacherId } }),
    ]);

    const exists = !!(existingTeacher || existingUser || existingParent || existingStudent);

    return NextResponse.json({ exists, teacherId });
  } catch (error) {
    console.error("Error checking teacher ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
