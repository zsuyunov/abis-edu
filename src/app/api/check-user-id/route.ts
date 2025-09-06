import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if userId exists in any user type
    const [existingUser, existingTeacher, existingParent, existingStudent] = await Promise.all([
      prisma.user.findFirst({ where: { userId } }),
      prisma.teacher.findFirst({ where: { teacherId: userId } }),
      prisma.parent.findFirst({ where: { parentId: userId } }),
      prisma.student.findFirst({ where: { studentId: userId } }),
    ]);

    const exists = !!(existingUser || existingTeacher || existingParent || existingStudent);

    return NextResponse.json({ exists, userId });
  } catch (error) {
    console.error("Error checking user ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
