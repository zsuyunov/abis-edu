/**
 * Token Refresh Endpoint
 * Implements rotating refresh tokens for enhanced security
 * - Verifies refresh token from httpOnly cookie
 * - Generates new access token and refresh token
 * - Revokes old refresh token (rotation)
 * - Validates tokenVersion for global invalidation
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { TokenService, SecurityLogger, RateLimiter, RateLimitPresets } from "@/lib/security";

async function postHandler(request: NextRequest) {
  const clientIp = RateLimiter.getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Rate limiting
    const rateLimitResult = RateLimiter.check(
      `refresh:${clientIp}`,
      RateLimitPresets.API
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Verify JWT signature and expiration
    const decoded = TokenService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Verify token exists in database and is not revoked
    const tokenRecord = await TokenService.verifyRefreshTokenInDB(refreshToken);

    if (!tokenRecord) {
      await SecurityLogger.logSuspiciousActivity(
        decoded.id,
        decoded.role,
        'Attempted to use invalid or revoked refresh token',
        clientIp,
        userAgent
      );

      return NextResponse.json(
        { error: "Refresh token has been revoked or is invalid" },
        { status: 401 }
      );
    }

    // Get user from database to verify tokenVersion
    let user = null;
    let userTable: string | null = null;

    // Determine which table to query based on role
    switch (decoded.role) {
      case 'admin':
        user = await prisma.admin.findUnique({ where: { id: decoded.id } });
        userTable = 'admin';
        break;
      case 'teacher':
        user = await prisma.teacher.findUnique({ where: { id: decoded.id } });
        userTable = 'teacher';
        break;
      case 'student':
        user = await prisma.student.findUnique({ where: { id: decoded.id } });
        userTable = 'student';
        break;
      case 'parent':
        user = await prisma.parent.findUnique({ where: { id: decoded.id } });
        userTable = 'parent';
        break;
      default:
        // Staff positions
        user = await prisma.user.findUnique({ 
          where: { id: decoded.id },
          include: { branch: true }
        });
        userTable = 'user';
        break;
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Verify tokenVersion matches (for global token invalidation)
    const currentTokenVersion = user.tokenVersion || 0;
    if (decoded.tokenVersion !== currentTokenVersion) {
      // Token version mismatch - tokens were globally invalidated
      await TokenService.revokeRefreshToken(refreshToken);
      
      await SecurityLogger.logSuspiciousActivity(
        user.id,
        decoded.role,
        'Token version mismatch - possible token theft or password change',
        clientIp,
        userAgent
      );

      return NextResponse.json(
        { error: "Token has been invalidated. Please login again." },
        { status: 401 }
      );
    }

    // Generate new tokens
    const tokenPayload = {
      id: user.id,
      phone: user.phone,
      role: decoded.role,
      name: (user as any).firstName || (user as any).name || 'User',
      surname: (user as any).lastName || (user as any).surname || 'User',
      branchId: (user as any).branchId || (user as any).branch?.id || null,
      tokenVersion: currentTokenVersion,
    };

    const newAccessToken = TokenService.generateAccessToken(tokenPayload);
    const { token: newRefreshToken, tokenId: newTokenId } = TokenService.generateRefreshToken(
      user.id,
      decoded.role,
      currentTokenVersion
    );

    // Store new refresh token
    await TokenService.storeRefreshToken(
      newTokenId,
      newRefreshToken,
      user.id,
      decoded.role,
      clientIp,
      userAgent
    );

    // Revoke old refresh token (rotation)
    await TokenService.revokeRefreshToken(refreshToken, newTokenId);

    // Log token refresh
    await SecurityLogger.logTokenRefresh(
      user.id,
      decoded.role,
      clientIp,
      userAgent
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });

    // Update cookies with new tokens
    response.cookies.set('auth_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/api/auth',
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    
    await SecurityLogger.logSuspiciousActivity(
      undefined,
      undefined,
      `Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      clientIp,
      userAgent
    );

    return NextResponse.json(
      { error: "Failed to refresh token. Please login again." },
      { status: 500 }
    );
  }
}

