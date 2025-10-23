/**
 * Secure Login Route
 * Implements OWASP best practices for authentication
 * - Rate limiting to prevent brute force
 * - Argon2 password verification
 * - Account lockout after failed attempts
 * - Security event logging
 * - Short-lived access tokens + rotating refresh tokens
 * - MFA support for admin/teacher accounts (currently disabled)
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { 
  PasswordService, 
  TokenService, 
  SecurityLogger, 
  // MFAService, // TODO: Uncomment when enabling MFA
  RateLimiter,
  RateLimitPresets
} from "@/lib/security";
import { loginSchema } from "@/lib/security/validation";
import { z } from "zod";

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

async function postHandler(request: NextRequest) {
  const clientIp = RateLimiter.getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Check for required environment variables
    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      console.error("Missing required environment variables:", {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasRefreshSecret: !!process.env.REFRESH_TOKEN_SECRET
      });
      return NextResponse.json(
        { error: "Server configuration error. Please contact administrator." },
        { status: 500 }
      );
    }
    // Rate limiting - prevent brute force attacks (ASYNC for Redis support)
    const rateLimitResult = await RateLimiter.checkAsync(
      `login:${clientIp}`,
      RateLimitPresets.LOGIN
    );

    if (!rateLimitResult.allowed) {
      await SecurityLogger.logSuspiciousActivity(
        undefined,
        undefined,
        'Rate limit exceeded for login attempts',
        clientIp,
        userAgent
      );

      return NextResponse.json(
        { 
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Check database connection
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection error. Please try again later." },
        { status: 500 }
      );
    }

    const { phone, password /*, mfaCode */ } = validationResult.data; // MFA disabled for now

    // Normalize phone formats to tolerate variations from spreadsheets
    const normalizedPhone = phone.trim();
    const digitsOnly = normalizedPhone.replace(/\D/g, '');
    const withPlus = normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`;
    const withoutPlus = normalizedPhone.startsWith('+') ? normalizedPhone.slice(1) : normalizedPhone;

    console.log(`\n🔐 Login attempt for phone: ${normalizedPhone}`);

    // Find user across all user tables
    let user: any = null; // Using 'any' to handle different user types with security fields
    let userRole: string | null = null;
    let userTable: string | null = null;

    // Prioritize Student accounts when multiple roles share the same phone number
    // Check Student FIRST
    const student = await prisma.student.findFirst({ 
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: withPlus },
          { phone: withoutPlus },
          { phone: digitsOnly },
        ],
      },
      select: {
        id: true,
        phone: true,
        password: true,
        tokenVersion: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastLoginAt: true,
        lastLoginIp: true,
        lastPasswordChange: true,
      } as any // Type assertion until Prisma client is regenerated after migration
    });
    if (student) {
      user = student;
      userRole = "student";
      userTable = "student";
    }

    // Then check Parent
    if (!user) {
      const parent = await prisma.parent.findFirst({ 
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: withPlus },
            { phone: withoutPlus },
            { phone: digitsOnly },
          ],
        },
        select: {
          id: true,
          phone: true,
          password: true,
          tokenVersion: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          lastLoginIp: true,
          lastPasswordChange: true,
        } as any // Type assertion until Prisma client is regenerated after migration
      });
      if (parent) {
        user = parent;
        userRole = "parent";
        userTable = "parent";
      }
    }

    // Then check Teacher
    if (!user) {
      const teacher = await prisma.teacher.findFirst({ 
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: withPlus },
            { phone: withoutPlus },
            { phone: digitsOnly },
          ],
        },
        select: {
          id: true,
          phone: true,
          password: true,
          tokenVersion: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          lastLoginIp: true,
          lastPasswordChange: true,
          // mfaEnabled: true, // Uncomment when enabling MFA
          // mfaSecret: true,  // Uncomment when enabling MFA
        } as any // Type assertion until Prisma client is regenerated after migration
      });
      if (teacher) {
        user = teacher;
        userRole = "teacher";
        userTable = "teacher";
      }
    }

    // Then check Admin
    if (!user) {
      const admin = await prisma.admin.findFirst({ 
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: withPlus },
            { phone: withoutPlus },
            { phone: digitsOnly },
          ],
        },
        select: {
          id: true,
          phone: true,
          password: true,
          tokenVersion: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          lastLoginIp: true,
          lastPasswordChange: true,
          // mfaEnabled: true, // Uncomment when enabling MFA
          // mfaSecret: true,  // Uncomment when enabling MFA
        } as any // Type assertion until Prisma client is regenerated after migration
      });
      if (admin) {
        user = admin;
        userRole = "admin";
        userTable = "admin";
      }
    }

    // Finally, check User table for staff positions
    if (!user) {
      const staffUser: any = await prisma.user.findFirst({ 
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: withPlus },
            { phone: withoutPlus },
            { phone: digitsOnly },
          ],
        },
        select: {
          id: true,
          phone: true,
          password: true,
          position: true,
          tokenVersion: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          lastLoginIp: true,
          lastPasswordChange: true,
          // mfaEnabled: true, // Uncomment when enabling MFA
          // mfaSecret: true,  // Uncomment when enabling MFA
          branch: true,
        } as any // Type assertion until Prisma client is regenerated after migration
      });
      if (staffUser) {
        user = staffUser;
        userRole = String(staffUser.position).toLowerCase();
        userTable = "user";
      }
    }

    // User not found
    if (!user || !userRole || !userTable) {
      console.log(`❌ User not found for phone: ${phone}`);
      await SecurityLogger.logLoginFailure(
        phone,
        'User not found',
        clientIp,
        userAgent
      );

      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    console.log(`✅ User found: ${user.id}, role: ${userRole}, table: ${userTable}`);
    console.log(`📝 Password hash starts with: ${user.password.substring(0, 10)}...`);

    // Check account lockout
    if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
      await SecurityLogger.logLoginFailure(
        phone,
        'Account locked',
        clientIp,
        userAgent
      );

      const lockoutRemaining = Math.ceil(
        (new Date(user.accountLockedUntil).getTime() - Date.now()) / 60000
      );

      return NextResponse.json(
        { 
          error: `Account locked due to too many failed attempts. Try again in ${lockoutRemaining} minutes.`,
          lockedUntil: user.accountLockedUntil
        },
        { status: 403 }
      );
    }

    // Verify password - check if hash is bcrypt or Argon2
    let isValidPassword = false;
    
    // Detect hash type: bcrypt starts with $2a$, $2b$, or $2y$
    // Argon2 starts with $argon2
    const isBcryptHash = user.password.startsWith('$2a$') || 
                         user.password.startsWith('$2b$') || 
                         user.password.startsWith('$2y$');
    
    if (isBcryptHash) {
      // Legacy bcrypt password - verify with bcrypt
      console.log(`🔐 Verifying bcrypt password for user ${user.id}`);
      const bcrypt = require('bcryptjs');
      isValidPassword = await bcrypt.compare(password, user.password);
      
      // If bcrypt works, upgrade to Argon2 for next login
      if (isValidPassword) {
        console.log(`🔄 Upgrading password hash to Argon2 for user ${user.id}`);
        try {
          const newHash = await PasswordService.hash(password);
          await (prisma as any)[userTable].update({
            where: { id: user.id },
            data: { 
              password: newHash,
              lastPasswordChange: new Date()
            }
          });
          console.log(`✅ Password upgraded successfully for user ${user.id}`);
        } catch (upgradeError) {
          console.error('Failed to upgrade password hash:', upgradeError);
          // Don't fail login if upgrade fails - user can still login
        }
      }
    } else {
      // New Argon2 password
      console.log(`🔐 Verifying Argon2 password for user ${user.id}`);
      isValidPassword = await PasswordService.verify(password, user.password);
    }

    console.log(`🔍 Password verification result: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log(`❌ Password verification failed for user ${user.id}`);
      
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Lock account after max failed attempts
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date();
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
        updateData.accountLockedUntil = lockoutUntil;

        await SecurityLogger.logAccountLocked(
          user.id,
          userRole,
          `Too many failed login attempts (${failedAttempts})`,
          clientIp,
          userAgent
        );
      }

      // Update user record
      await (prisma as any)[userTable].update({
        where: { id: user.id },
        data: updateData,
      });

      await SecurityLogger.logLoginFailure(
        phone,
        `Invalid password (attempt ${failedAttempts}/${MAX_FAILED_ATTEMPTS})`,
        clientIp,
        userAgent
      );

      return NextResponse.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // ============================================
    // MFA LOGIC - COMMENTED OUT (Enable later)
    // ============================================
    /*
    // Check if MFA is enabled and required
    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode) {
        return NextResponse.json(
          { 
            error: "MFA code required",
            requiresMfa: true 
          },
          { status: 401 }
        );
      }

      // Verify MFA code
      const isMfaValid = MFAService.verifyToken(mfaCode, user.mfaSecret);

      if (!isMfaValid) {
        await SecurityLogger.logMFAVerificationFailed(
          user.id,
          userRole,
          clientIp,
          userAgent
        );

      return NextResponse.json(
          { error: "Invalid MFA code" },
        { status: 401 }
      );
    }

      await SecurityLogger.logMFAVerificationSuccess(
        user.id,
        userRole,
        clientIp,
        userAgent
      );
    }
    */
    // ============================================

    // Successful login - reset failed attempts and update last login
    await (prisma as any)[userTable].update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
      },
    });

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      phone: user.phone,
      role: userRole,
      name: (user as any).firstName || (user as any).name || 'User',
      surname: (user as any).lastName || (user as any).surname || 'User',
      branchId: (user as any).branchId || (user as any).branch?.id || null,
      tokenVersion: user.tokenVersion || 0,
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const { token: refreshToken, tokenId } = TokenService.generateRefreshToken(
      user.id,
      userRole,
      user.tokenVersion || 0
    );

    // Store refresh token in database
    await TokenService.storeRefreshToken(
      tokenId,
      refreshToken,
      user.id,
      userRole,
      clientIp,
      userAgent
    );

    // Log successful login
    await SecurityLogger.logLoginSuccess(
      user.id,
      userRole,
      clientIp,
      userAgent
    );

    // Clear rate limit on successful login
    await RateLimiter.reset(`login:${clientIp}`);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: userRole,
        name: tokenPayload.name,
        surname: tokenPayload.surname,
        branchId: tokenPayload.branchId,
      },
      accessToken,
    });

    // Set access token in httpOnly cookie (short-lived)
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    // Set refresh token in httpOnly cookie (longer-lived)
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/api/auth',
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    
    await SecurityLogger.logSuspiciousActivity(
      undefined,
      undefined,
      `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      clientIp,
      userAgent
    );

    // Never expose internal errors to users
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 }
    );
  } finally {
    // Don't disconnect the shared Prisma client - it should remain connected for other operations
    // await prisma.$disconnect();
  }
}

// Login endpoint doesn't use CSRF protection because there's no session yet
// CSRF will be enforced on authenticated endpoints after login
export const POST = postHandler;
