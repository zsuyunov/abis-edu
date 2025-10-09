/**
 * Password Reset Request Endpoint
 * Generates a secure token and sends it to the user (simulated)
 * In production, this would send an email/SMS
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { SecurityLogger, RateLimiter, RateLimitPresets } from "@/lib/security";
import { passwordResetRequestSchema } from "@/lib/security/validation";
import crypto from 'crypto';

async function postHandler(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Rate limiting - strict for password reset
    const rateLimitResult = RateLimiter.check(
      `pwd-reset:${clientIp}`,
      RateLimitPresets.PASSWORD_RESET
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const validationResult = passwordResetRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { phone } = validationResult.data;

    // Find user (check all tables)
    let user = null;
    let userRole: string | null = null;
    let userTable: string | null = null;

    // Check Admin
    const admin = await prisma.admin.findUnique({ where: { phone } });
    if (admin) {
      user = admin;
      userRole = "admin";
      userTable = "admin";
    }

    // Check Teacher
    if (!user) {
      const teacher = await prisma.teacher.findUnique({ where: { phone } });
      if (teacher) {
        user = teacher;
        userRole = "teacher";
        userTable = "teacher";
      }
    }

    // Check Student
    if (!user) {
      const student = await prisma.student.findFirst({ where: { phone } });
      if (student) {
        user = student;
        userRole = "student";
        userTable = "student";
      }
    }

    // Check Parent
    if (!user) {
      const parent = await prisma.parent.findUnique({ where: { phone } });
      if (parent) {
        user = parent;
        userRole = "parent";
        userTable = "parent";
      }
    }

    // Check User table
    if (!user) {
      const staffUser = await prisma.user.findUnique({ where: { phone } });
      if (staffUser) {
        user = staffUser;
        userRole = staffUser.position.toLowerCase();
        userTable = "user";
      }
    }

    // Always return success even if user not found (prevent user enumeration)
    if (!user || !userTable) {
      return NextResponse.json({
        success: true,
        message: "If an account with this phone number exists, a password reset token will be provided."
      });
    }

    // Generate secure reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    // Store reset token in database
    // Only Admin, Teacher, and User tables have reset token fields
    if (userTable === 'admin' || userTable === 'teacher' || userTable === 'user') {
      await (prisma as any)[userTable].update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetTokenExpiry,
        }
      });

      // Log password reset request
      await SecurityLogger.logPasswordResetRequest(
        user.id,
        userRole!,
        clientIp,
        userAgent
      );
    }

    // In production, send reset token via email/SMS
    // For now, return it in response (REMOVE IN PRODUCTION!)
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: "If an account with this phone number exists, a password reset token will be provided.",
      // Only include token in development
      ...(isDevelopment && userTable && (userTable === 'admin' || userTable === 'teacher' || userTable === 'user') && {
        resetToken,
        userId: user.id,
        expiresAt: resetTokenExpiry
      })
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}

