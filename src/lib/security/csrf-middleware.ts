/**
 * CSRF Middleware for API Routes
 * PRODUCTION-READY: Protects all state-changing operations
 * 
 * Usage in API routes:
 * import { withCSRF } from '@/lib/security/csrf-middleware';
 * 
 * export const POST = withCSRF(async (request) => {
 *   // Your route logic here
 *   return NextResponse.json({ success: true });
 * });
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from './csrf';
import { verifyJwt } from './verifyJwt';

/**
 * Extract session ID from request with JWT signature verification
 * SECURITY FIX: Now verifies JWT signature instead of just decoding
 */
function getSessionId(request: NextRequest): string | null {
  // Try to get from auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) {
    try {
      // SECURITY: Verify JWT signature before extracting session ID
      const payload = verifyJwt(authToken);
      if (payload && payload.id) {
        return payload.id;
      }
    } catch (error) {
      console.error('Failed to extract session ID from token:', error);
    }
  }
  
  // Fallback to IP-based session ID (less secure, but works for public endpoints)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `ip:${ip}`;
}

/**
 * CSRF Protection Middleware
 * Wraps API route handlers with automatic CSRF validation
 * 
 * @param handler - API route handler
 * @param options - Configuration options
 * @returns Wrapped handler with CSRF protection
 */
export function withCSRF(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    methods?: string[]; // Methods to protect (default: POST, PUT, DELETE, PATCH)
    required?: boolean; // If false, only logs CSRF failures (default: true)
  } = {}
) {
  const protectedMethods = options.methods || ['POST', 'PUT', 'DELETE', 'PATCH'];
  const required = options.required !== false;

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Only check CSRF for state-changing methods
    if (!protectedMethods.includes(request.method)) {
      return handler(request, context);
    }

    const sessionId = getSessionId(request);
    
    if (!sessionId) {
      console.warn('⚠️ CSRF check skipped: No session ID found');
      // For routes without auth, we can't enforce CSRF strictly
      // This prevents breaking public endpoints
      if (required) {
        return NextResponse.json(
          { error: 'Authentication required for CSRF protection' },
          { status: 401 }
        );
      }
      return handler(request, context);
    }

    // Verify CSRF token
    const isValid = await CSRFProtection.protect(sessionId, request);
    
    if (!isValid) {
      if (required) {
        console.log(`🛡️ CSRF validation failed for session ${sessionId} on ${request.method} ${request.nextUrl.pathname}`);
        return NextResponse.json(
          { 
            error: 'CSRF validation failed. Please refresh the page and try again.',
            code: 'CSRF_INVALID'
          },
          { 
            status: 403,
            headers: {
              'X-CSRF-Error': 'Invalid or missing CSRF token'
            }
          }
        );
      } else {
        console.warn(`⚠️ CSRF validation failed but not required for ${request.nextUrl.pathname}`);
      }
    }

    // CSRF valid or not required - proceed with handler
    return handler(request, context);
  };
}

/**
 * Optional: CSRF protection that only logs failures (for gradual rollout)
 */
export function withCSRFLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withCSRF(handler, { required: false });
}

/**
 * Helper: Check if request has valid CSRF token (for manual checking)
 */
export async function validateCSRF(request: NextRequest): Promise<boolean> {
  const sessionId = getSessionId(request);
  if (!sessionId) return false;
  
  return await CSRFProtection.protect(sessionId, request);
}

