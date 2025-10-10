/**
 * Centralized JWT Verification Utility
 * SECURITY-CRITICAL: Always verifies JWT signatures before trusting payload
 * 
 * This replaces all insecure jwt.decode() or manual base64 decoding
 * Never trust JWT payloads without signature verification!
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error('REFRESH_TOKEN_SECRET environment variable is required');
}

export interface JwtPayload {
  id: string;
  phone: string;
  role: string;
  name?: string;
  surname?: string;
  branchId?: string | number;
  tokenVersion?: number;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export interface RefreshTokenPayload {
  id: string;
  role: string;
  tokenVersion: number;
  type: 'refresh';
  jti?: string;
  exp?: number;
}

/**
 * Verify and decode an access token (JWT)
 * SECURITY: Always checks signature, issuer, and audience
 * 
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HMAC SHA-256
      issuer: 'school-management-system',
      audience: 'school-app',
    }) as JwtPayload;

    // Additional validation
    if (!decoded.id || !decoded.role) {
      console.error('JWT missing required fields (id, role)');
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT verification failed: Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT verification failed:', error.message);
    } else {
      console.error('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  }
}

/**
 * Verify and decode a refresh token
 * SECURITY: Uses separate secret, verifies signature
 * 
 * @param token - Refresh token
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshJwt(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      algorithms: ['HS256'],
      issuer: 'school-management-system',
      audience: 'school-app',
    }) as RefreshTokenPayload;

    // Validate refresh token type
    if (decoded.type !== 'refresh') {
      console.error('Token is not a refresh token');
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Refresh token verification failed: Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Refresh token verification failed:', error.message);
    } else {
      console.error('Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  }
}

/**
 * Verify JWT for middleware use
 * Performs signature verification and basic checks
 * Full tokenVersion validation happens in API routes via TokenService
 * 
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export function verifyJwtForMiddleware(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'school-management-system',
      audience: 'school-app',
      // Note: Token expiry is automatically checked by jwt.verify
    }) as JwtPayload;

    // Reject tokens without tokenVersion (legacy tokens)
    if (decoded.tokenVersion === undefined || decoded.tokenVersion === null) {
      console.log(`⚠️ Rejecting legacy token without tokenVersion for user ${decoded.id}`);
      return null;
    }

    return decoded;
  } catch (error) {
    // Log JWT verification errors for debugging
    if (error instanceof jwt.TokenExpiredError) {
      console.log('⚠️ JWT verification failed in middleware: Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log(`⚠️ JWT verification failed in middleware: ${error.message}`);
    } else {
      console.log(`⚠️ JWT verification failed in middleware: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return null;
  }
}

/**
 * UNSAFE: Decode JWT without verification
 * ⚠️ WARNING: Only use for non-security purposes (logging, debugging)
 * NEVER use this for authentication or authorization!
 * 
 * @param token - JWT token
 * @returns Decoded payload (UNVERIFIED) or null
 */
export function unsafeDecodeJwt(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    
    return payload;
  } catch {
    return null;
  }
}

