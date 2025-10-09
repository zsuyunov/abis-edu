/**
 * CSRF (Cross-Site Request Forgery) Protection - PRODUCTION-READY
 * Protects state-changing operations from CSRF attacks
 * Uses Redis for distributed storage (falls back to in-memory for dev)
 */

import { NextRequest } from 'next/server';
import * as crypto from 'crypto';
import { getStorage } from './redis-adapter';

// Storage adapter (Redis or in-memory)
const storage = getStorage();

// CSRF token lifetime (1 hour)
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

export class CSRFProtection {
  /**
   * Generate a CSRF token for a session
   * @param sessionId - Unique session identifier
   * @returns CSRF token string
   */
  static async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('base64url');
    const key = `csrf:${sessionId}`;
    
    const data = JSON.stringify({
      token,
      expiresAt: Date.now() + TOKEN_LIFETIME_MS,
    });
    
    // Store with TTL (1 hour)
    await storage.set(key, data, Math.ceil(TOKEN_LIFETIME_MS / 1000));
    
    return token;
  }

  /**
   * Verify a CSRF token
   * @param sessionId - Session identifier
   * @param token - Token to verify
   * @returns True if valid, false otherwise
   */
  static async verifyToken(sessionId: string, token: string): Promise<boolean> {
    const key = `csrf:${sessionId}`;
    const recordStr = await storage.get(key);
    
    if (!recordStr) return false;
    
    const record: { token: string; expiresAt: number } = JSON.parse(recordStr);
    
    // Check expiry
    if (Date.now() > record.expiresAt) {
      await storage.del(key);
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    // Use Uint8Array for proper TypeScript compatibility
    const encoder = new TextEncoder();
    const tokenA = encoder.encode(record.token);
    const tokenB = encoder.encode(token);
    
    // timingSafeEqual requires equal-length inputs
    if (tokenA.length !== tokenB.length) return false;
    
    return crypto.timingSafeEqual(tokenA, tokenB);
  }

  /**
   * Extract CSRF token from request
   * Checks both header and query parameter
   * @param request - Next.js request
   * @returns Token string or null
   */
  static extractToken(request: NextRequest): string | null {
    // Prefer header (more secure)
    const headerToken = request.headers.get('x-csrf-token');
    if (headerToken) return headerToken;
    
    // Fallback to query parameter (less secure, use header when possible)
    const { searchParams } = new URL(request.url);
    return searchParams.get('csrf_token');
  }

  /**
   * Middleware to protect routes from CSRF
   * @param sessionId - Session identifier (from cookie or auth token)
   * @param request - Next.js request
   * @returns True if valid, false if CSRF check fails
   */
  static async protect(sessionId: string, request: NextRequest): Promise<boolean> {
    // Only check CSRF for state-changing methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      return true;
    }
    
    const token = this.extractToken(request);
    if (!token) {
      console.log('⚠️ CSRF check failed: No token provided');
      return false;
    }
    
    const isValid = await this.verifyToken(sessionId, token);
    if (!isValid) {
      console.log(`⚠️ CSRF check failed for session ${sessionId}`);
    }
    
    return isValid;
  }

  /**
   * Revoke CSRF token for a session (on logout)
   * @param sessionId - Session identifier
   */
  static async revokeToken(sessionId: string): Promise<void> {
    const key = `csrf:${sessionId}`;
    await storage.del(key);
  }

  /**
   * Cleanup expired tokens (run periodically)
   * Note: Redis with TTL handles this automatically
   */
  static async cleanupExpired(): Promise<void> {
    // With Redis TTL, this is handled automatically
    // For in-memory storage, the storage adapter handles cleanup
    console.log('✅ CSRF token cleanup (handled by storage TTL)');
  }
}

/**
 * USAGE EXAMPLE:
 * 
 * // In your API route:
 * export async function POST(request: NextRequest) {
 *   const sessionId = getUserSessionId(request); // Get from cookie or token
 *   
 *   // Verify CSRF
 *   const csrfValid = await CSRFProtection.protect(sessionId, request);
 *   if (!csrfValid) {
 *     return NextResponse.json(
 *       { error: 'Invalid CSRF token' },
 *       { status: 403 }
 *     );
 *   }
 *   
 *   // Process request...
 * }
 * 
 * // Generate token for client:
 * const csrfToken = await CSRFProtection.generateToken(sessionId);
 * // Send token to client (in response body or cookie)
 */
