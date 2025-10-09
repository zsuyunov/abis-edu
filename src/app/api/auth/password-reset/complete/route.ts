/**
 * Password Reset Completion Endpoint
 * Verifies reset token and sets new password
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { PasswordService, TokenService, SecurityLogger } from "@/lib/security";
import { passwordResetCompleteSchema } from "@/lib/security/validation";

async function postHandler(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Validate input
    const body = await request.json();
    const validationResult = passwordResetCompleteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { token, newPassword } = validationResult.data;

    // Find user by reset token (check tables that support password reset)
    let user = null;
    let userRole: string | null = null;
    let userTable: string | null = null;

    // Check Admin
    const admin = await prisma.admin.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });
    if (admin) {
      user = admin;
      userRole = "admin";
      userTable = "admin";
    }

    // Check Teacher
    if (!user) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: new Date() }
        }
      });
      if (teacher) {
        user = teacher;
        userRole = "teacher";
        userTable = "teacher";
      }
    }

    // Check User table
    if (!user) {
      const staffUser = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: new Date() }
        }
      });
      if (staffUser) {
        user = staffUser;
        userRole = staffUser.position.toLowerCase();
        userTable = "user";
      }
    }

    if (!user || !userTable) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "Password does not meet requirements", details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Hash new password with Argon2
    const hashedPassword = await PasswordService.hash(newPassword);

    // Update user: set new password, clear reset token, increment tokenVersion
    await (prisma as any)[userTable].update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: { increment: 1 }, // Invalidate all existing tokens
        lastPasswordChange: new Date(),
        failedLoginAttempts: 0, // Reset failed attempts
        accountLockedUntil: null, // Unlock account if locked
      }
    });

    // Revoke all refresh tokens for this user
    await TokenService.revokeAllUserTokens(user.id, userRole!);

    // Log password reset completion
    await SecurityLogger.log({
      userId: user.id,
      userRole: userRole!,
      eventType: 'PASSWORD_RESET_COMPLETE',
      eventStatus: 'SUCCESS',
      ipAddress: clientIp,
      userAgent,
      details: 'Password reset completed successfully',
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Please login with your new password."
    });
  } catch (error) {
    console.error("Password reset completion error:", error);
    
    return NextResponse.json(
      { error: "An error occurred resetting your password" },
      { status: 500 }
    );
  }
}

