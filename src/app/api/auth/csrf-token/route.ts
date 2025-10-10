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

export async function GET(request: NextRequest) {
  try {
    // Get session ID from auth token
    const authToken = request.cookies.get('auth_token')?.value;
    
    // For login page, we don't have auth token yet, so return a simple response
    if (!authToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 200 } // Changed from 401 to 200 to prevent login page errors
      );
    }

    // Decode JWT to get user ID
    let sessionId: string;
    try {
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        sessionId = payload.id;
      } else {
        throw new Error('Invalid token format');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Generate CSRF token
    const csrfToken = await CSRFProtection.generateToken(sessionId);

    return NextResponse.json({
      token: csrfToken,
      expiresIn: 3600, // 1 hour in seconds
      usage: {
        header: 'x-csrf-token',
        queryParam: 'csrf_token',
      },
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

