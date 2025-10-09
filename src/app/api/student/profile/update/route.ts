import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PasswordService } from "@/lib/security";

async function putHandler(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id');
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, currentPassword, newPassword } = await request.json();

    console.log(`🔍 Profile update request for student ${studentId}:`, {
      phone: phone ? 'provided' : 'missing',
      currentPassword: currentPassword ? 'provided' : 'missing',
      newPassword: newPassword ? 'provided' : 'missing'
    });

    // Validate required fields
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Get current student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        phone: true,
        password: true,
        firstName: true,
        lastName: true,
        studentId: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }

      // Check if password is bcrypt or Argon2 format
      const isBcryptHash = student.password.startsWith('$2y$') || student.password.startsWith('$2a$') || student.password.startsWith('$2b$');
      
      console.log(`🔍 Password hash format for student ${studentId}:`, {
        isBcrypt: isBcryptHash,
        hashPrefix: student.password.substring(0, 10) + '...',
        hashLength: student.password.length
      });
      
      let isCurrentPasswordValid = false;
      
      if (isBcryptHash) {
        // Legacy bcrypt password - verify with bcrypt
        console.log(`🔐 Verifying bcrypt password for student ${studentId}`);
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, student.password);
      } else {
        // New Argon2 password
        console.log(`🔐 Verifying Argon2 password for student ${studentId}`);
        isCurrentPasswordValid = await PasswordService.verify(currentPassword, student.password);
      }

      console.log(`🔍 Password verification result: ${isCurrentPasswordValid}`);

      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    // Hash new password if provided
    let hashedPassword = student.password;
    if (newPassword) {
      // Use Argon2 for new passwords (consistent with login system)
      hashedPassword = await PasswordService.hash(newPassword);
    }

    // Update student profile
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        phone: phone.trim(),
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        studentId: true,
        updatedAt: true
      }
    });

    console.log(`✅ Student profile updated: ${studentId}`);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully. If you changed your password, please log out and log back in.",
      data: {
        id: updatedStudent.id,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        phone: updatedStudent.phone,
        studentId: updatedStudent.studentId,
        updatedAt: updatedStudent.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating student profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export const PUT = withCSRF(putHandler);
