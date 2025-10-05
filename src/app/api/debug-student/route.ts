import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        expectedPassword: `${student.lastName}_suzuk`,
        passwordHash: student.password.substring(0, 20) + "..."
      }
    });

  } catch (error) {
    console.error("Error debugging student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to debug student" },
      { status: 500 }
    );
  }
}
