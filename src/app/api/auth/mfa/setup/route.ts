/**
 * ⚠️ MFA Setup Route - CURRENTLY DISABLED
 * 
 * This endpoint allows users to set up Multi-Factor Authentication.
 * To enable MFA, see instructions in src/lib/security/mfa.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';

async function postHandler(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'MFA is currently disabled. Contact administrator for more information.',
      disabled: true 
    },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'MFA is currently disabled. Contact administrator for more information.',
      disabled: true 
    },
    { status: 503 }
  );
}

/*
// ORIGINAL MFA SETUP CODE - UNCOMMENT TO ENABLE

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MFAService, SecurityLogger } from '@/lib/security';
import { verifyToken } from '@/lib/auth';

// POST /api/auth/mfa/setup - Generate MFA secret and QR code
async function postHandler(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: userId, role: userRole } = decoded;

    // Only allow admin and teacher roles to enable MFA
    if (!['admin', 'teacher'].includes(userRole)) {
      return NextResponse.json(
        { error: 'MFA is only available for admin and teacher accounts' },
        { status: 403 }
      );
    }

    // Generate MFA secret
    const { secret, qrCodeUrl } = MFAService.generateSecret(userId);

    // Store secret temporarily (not enabled until verification)
    const userTable = userRole === 'admin' ? 'admin' : 'teacher';
    await (prisma as any)[userTable].update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaEnabled: false, // Not enabled until user verifies
      },
    });

    return NextResponse.json({
      secret,
      qrCodeUrl,
      message: 'Scan QR code with authenticator app and verify to enable MFA',
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/mfa/setup - Verify and enable MFA
async function putHandler(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: userId, role: userRole } = decoded;
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'MFA token required' },
        { status: 400 }
      );
    }

    // Get user's MFA secret
    const userTable = userRole === 'admin' ? 'admin' : 'teacher';
    const user = await (prisma as any)[userTable].findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user?.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA not set up. Call POST /api/auth/mfa/setup first' },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = MFAService.verifyToken(token, user.mfaSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid MFA token' },
        { status: 401 }
      );
    }

    // Enable MFA
    await (prisma as any)[userTable].update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await SecurityLogger.logMFAEnabled(userId, userRole);

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable MFA' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/mfa/setup - Disable MFA
async function deleteHandler(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: userId, role: userRole } = decoded;

    // Disable MFA
    const userTable = userRole === 'admin' ? 'admin' : 'teacher';
    await (prisma as any)[userTable].update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    await SecurityLogger.logMFADisabled(userId, userRole);

    return NextResponse.json({
      success: true,
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
}
*/
