import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

async function postHandler(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone number and password are required" },
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

    // Test password verification
    const isValidPassword = await AuthService.verifyPassword(password, student.password);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        phone: student.phone
      },
      passwordTest: {
        providedPassword: password,
        expectedPassword: `${student.firstName.split(' ')[0].toLowerCase()}_abisedu`,
        isValid: isValidPassword,
        passwordMatches: password === `${student.firstName.split(' ')[0].toLowerCase()}_abisedu`
      }
    });

  } catch (error) {
    console.error("Error testing password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to test password" },
      { status: 500 }
    );
  }
}

export const POST = withCSRF(postHandler);
