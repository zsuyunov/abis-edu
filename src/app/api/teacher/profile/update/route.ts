import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

async function putHandler(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Get current teacher data
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        phone: true,
        password: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, teacher.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    // Hash new password if provided
    let hashedPassword = teacher.password;
    if (newPassword) {
      hashedPassword = await bcrypt.hash(newPassword, 12);
    }

    // Update teacher profile
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        phone: phone.trim(),
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        updatedAt: true
      }
    });

    // Log the credential update for security
    
    // Note: Session invalidation would require a Session model in the database
    // For now, the user will need to log out and log back in manually

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully. If you changed your password, please log out and log back in.",
      data: {
        id: updatedTeacher.id,
        firstName: updatedTeacher.firstName,
        lastName: updatedTeacher.lastName,
        email: updatedTeacher.email,
        phone: updatedTeacher.phone,
        updatedAt: updatedTeacher.updatedAt
      }
    });

  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export const PUT = authenticateJWT(authorizeRole('TEACHER')(withCSRF(putHandler)));
