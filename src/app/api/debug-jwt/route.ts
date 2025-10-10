/**
 * JWT Debug Endpoint - TEMPORARY FOR DEBUGGING
 * DELETE THIS FILE AFTER FIXING THE ISSUE!
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/security/tokens';
import { verifyJwt } from '@/lib/security/verifyJwt';

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (!authToken) {
    return NextResponse.json({
      error: 'No auth token found',
      hasToken: false,
    });
  }

  // Try to verify with our new function
  const verifiedPayload = verifyJwt(authToken);
  
  // Also try with TokenService
  const tokenServiceResult = await TokenService.verifyAccessToken(authToken);

  // Decode without verification (just to see structure)
  let unsafeDecoded = null;
  try {
    const parts = authToken.split('.');
    if (parts.length === 3) {
      unsafeDecoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    }
  } catch (e) {
    unsafeDecoded = { error: 'Failed to decode' };
  }

  return NextResponse.json({
    hasToken: true,
    tokenLength: authToken.length,
    tokenPreview: authToken.substring(0, 50) + '...',
    verifyJwtResult: verifiedPayload ? 'SUCCESS' : 'FAILED',
    verifiedPayload: verifiedPayload || 'null',
    tokenServiceResult: tokenServiceResult ? 'SUCCESS' : 'FAILED',
    tokenServicePayload: tokenServiceResult || 'null',
    unsafeDecoded: unsafeDecoded,
    envCheck: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      hasRefreshSecret: !!process.env.REFRESH_TOKEN_SECRET,
    }
  });
}

