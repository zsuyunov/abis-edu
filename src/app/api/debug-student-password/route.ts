import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PasswordService } from "@/lib/security";

async function postHandler(request: NextRequest) {
  try {
    const { studentId, password } = await request.json();

    if (!studentId || !password) {
      return NextResponse.json(
        { error: "Student ID and password are required" },
        { status: 400 }
      );
    }

    // Find student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        password: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check password hash format
    const isBcryptHash = student.password.startsWith('$2y$') || student.password.startsWith('$2a$') || student.password.startsWith('$2b$');
    
    // Test both verification methods
    let bcryptResult = false;
    let argon2Result = false;
    
    if (isBcryptHash) {
      bcryptResult = await bcrypt.compare(password, student.password);
    } else {
      argon2Result = await PasswordService.verify(password, student.password);
    }

    // Expected password format (based on seed files)
    const expectedPassword = `${student.firstName.split(' ')[0].toLowerCase()}_abisedu`;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`
      },
      passwordInfo: {
        providedPassword: password,
        expectedPassword: expectedPassword,
        passwordMatches: password === expectedPassword,
        hashFormat: isBcryptHash ? 'bcrypt' : 'argon2',
        hashPrefix: student.password.substring(0, 10) + '...',
        hashLength: student.password.length,
        verificationResults: {
          bcrypt: bcryptResult,
          argon2: argon2Result,
          overallValid: bcryptResult || argon2Result
        }
      }
    });

  } catch (error) {
    console.error("Error debugging student password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to debug password" },
      { status: 500 }
    );
  }
}
