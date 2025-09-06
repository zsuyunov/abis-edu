import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Check if studentId exists in any user type
    const [existingStudent, existingUser, existingTeacher, existingParent] = await Promise.all([
      prisma.student.findFirst({ where: { studentId } }),
      prisma.user.findFirst({ where: { userId: studentId } }),
      prisma.teacher.findFirst({ where: { teacherId: studentId } }),
      prisma.parent.findFirst({ where: { parentId: studentId } }),
    ]);

    const exists = !!(existingStudent || existingUser || existingTeacher || existingParent);

    return NextResponse.json({ exists, studentId });
  } catch (error) {
    console.error("Error checking student ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
