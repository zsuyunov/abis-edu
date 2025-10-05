import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Find student by phone
    const student = await prisma.student.findFirst({ 
      where: { phone },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        phone: true,
        password: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Reset password to lastName_suzuk
    const newPassword = `${student.lastName}_suzuk`;
    const hashedPassword = await AuthService.hashPassword(newPassword);

    await prisma.student.update({
      where: { id: student.id },
      data: { password: hashedPassword },
    });

    // Verify the password was updated
    const updatedStudent = await prisma.student.findUnique({
      where: { id: student.id },
      select: { password: true }
    });

    const passwordMatches = await AuthService.verifyPassword(newPassword, updatedStudent?.password || '');

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        phone: student.phone
      },
      passwordReset: {
        newPassword: newPassword,
        hashed: hashedPassword.substring(0, 20) + "...",
        verified: passwordMatches
      }
    });

  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
