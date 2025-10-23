/**
 * Secure Logout Endpoint
 * - Revokes current refresh token
 * - Optionally revokes all user tokens (logout from all devices)
 * - Clears authentication cookies
 * - Logs logout event
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { TokenService, SecurityLogger } from "@/lib/security";

async function postHandler(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get('auth_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    let userId: string | undefined;
    let userRole: string | undefined;

    // Try to get user info from access token first
    if (accessToken) {
      const decoded = await TokenService.verifyAccessToken(accessToken);
      if (decoded) {
        userId = decoded.id;
        userRole = decoded.role;
      }
    }

    // Try refresh token if access token failed
    if (!userId && refreshToken) {
      const decoded = await TokenService.verifyRefreshToken(refreshToken);
      if (decoded) {
        userId = decoded.id;
        userRole = decoded.role;
      }
    }

    // Revoke refresh token if present
    if (refreshToken) {
      await TokenService.revokeRefreshToken(refreshToken);
    }

    // Log logout event
    if (userId && userRole) {
      await SecurityLogger.logLogout(userId, userRole, clientIp, userAgent);
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    // Clear all authentication cookies
    const cookiesToClear = [
      "auth_token",
      "refresh_token",
      "__session",
      "__session_61dFzdSC",
      "__clerk_db_jwt",
      "__clerk_db_jwt_u6pPacZK",
      "__clerk_db_jwt_TDWNA_Aa",
      "__clerk_db_jwt_61dFzdSC",
      "userId"
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if logout fails, clear cookies and return success
    // This prevents users from being stuck in a logged-in state
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });

    return response;
  }
}

export const POST = withCSRF(postHandler);

/**
 * Logout from all devices
 * Increments tokenVersion to invalidate all existing tokens
 */
async function deleteHandler(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const accessToken = request.cookies.get('auth_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = await TokenService.verifyAccessToken(accessToken);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Determine user table
    let userTable: string;
    switch (decoded.role) {
      case 'admin': userTable = 'admin'; break;
      case 'teacher': userTable = 'teacher'; break;
      case 'student': userTable = 'student'; break;
      case 'parent': userTable = 'parent'; break;
      default: userTable = 'user'; break;
    }

    // Import prisma dynamically to avoid circular dependencies
    const { default: prisma } = await import('@/lib/prisma');

    // Increment tokenVersion to invalidate all tokens
    await (prisma as any)[userTable].update({
      where: { id: decoded.id },
      data: {
        tokenVersion: { increment: 1 }
      }
    });

    // Revoke all refresh tokens
    await TokenService.revokeAllUserTokens(decoded.id, decoded.role);

    // Log logout from all devices
    await SecurityLogger.log({
      userId: decoded.id,
      userRole: decoded.role,
      eventType: 'LOGOUT',
      eventStatus: 'SUCCESS',
      ipAddress: clientIp,
      userAgent,
      details: 'Logged out from all devices',
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out from all devices successfully"
    });

    // Clear cookies
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error("Logout all devices error:", error);
    
    return NextResponse.json(
      { error: "Failed to logout from all devices" },
      { status: 500 }
    );
  }
}

export const DELETE = withCSRF(deleteHandler);
