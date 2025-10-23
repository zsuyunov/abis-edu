/**
 * CSRF Token Generation Endpoint
 * Returns a CSRF token for the current session
 * 
 * Frontend should:
 * 1. Call this endpoint on page load
 * 2. Include the token in subsequent POST/PUT/DELETE requests via:
 *    - Header: x-csrf-token: <token>
 *    - OR Query param: ?csrf_token=<token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf';
import { verifyJwt } from '@/lib/security/verifyJwt';

export async function GET(request: NextRequest) {
  try {
    // Get session ID from auth token
    const authToken = request.cookies.get('auth_token')?.value;
    
    // For login page, we don't have auth token yet, so return a simple response
    if (!authToken) {
      console.log('⚠️ No auth token found for CSRF token generation');
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 200 } // Changed from 401 to 200 to prevent login page errors
      );
    }

    // Verify JWT signature and get user ID (SECURITY FIX)
    const payload = verifyJwt(authToken);
    if (!payload || !payload.id) {
      console.error('❌ Invalid token or signature verification failed');
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const sessionId = payload.id;
    console.log(`✅ Generating CSRF token for session: ${sessionId}`);

    // Generate CSRF token with timeout protection
    const csrfToken = await Promise.race([
      CSRFProtection.generateToken(sessionId),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('CSRF token generation timeout')), 3000)
      )
    ]);
    console.log(`✅ CSRF token generated successfully for session ${sessionId}`);

    const response = NextResponse.json({
      token: csrfToken,
      expiresIn: 3600, // 1 hour in seconds
      usage: {
        header: 'x-csrf-token',
        queryParam: 'csrf_token',
      },
    });

    // Also set CSRF token in a cookie for easier access
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

