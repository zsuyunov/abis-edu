import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    if (!parentId) {
      return NextResponse.json({ error: "Parent ID is required" }, { status: 400 });
    }

    // Check if parentId exists in any user type
    const [existingParent, existingUser, existingTeacher, existingStudent] = await Promise.all([
      prisma.parent.findFirst({ where: { parentId } }),
      prisma.user.findFirst({ where: { userId: parentId } }),
      prisma.teacher.findFirst({ where: { teacherId: parentId } }),
      prisma.student.findFirst({ where: { studentId: parentId } }),
    ]);

    const exists = !!(existingParent || existingUser || existingTeacher || existingStudent);

    return NextResponse.json({ exists, parentId });
  } catch (error) {
    console.error("Error checking parent ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
