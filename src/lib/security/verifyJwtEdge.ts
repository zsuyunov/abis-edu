/**
 * Edge Runtime JWT Verification
 * Uses jose library (compatible with Edge Runtime - no Node.js crypto dependency)
 * 
 * IMPORTANT: This is for Edge Runtime ONLY (middleware, edge API routes)
 * For Node.js API routes, use /lib/security/verifyJwt.ts which uses jsonwebtoken
 */

import { jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface EdgeJwtPayload extends JWTPayload {
  id: string;
  phone: string;
  role: string;
  name?: string;
  surname?: string;
  branchId?: string | number;
  tokenVersion?: number;
}

/**
 * Verify JWT for Edge Runtime (middleware)
 * Uses jose library which is Edge Runtime compatible
 * 
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export async function verifyJwtEdge(token: string): Promise<EdgeJwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'school-management-system',
      audience: 'school-app',
      algorithms: ['HS256'],
    });

    // Validate required fields
    if (!payload.id || !payload.role) {
      console.error('JWT missing required fields (id, role)');
      return null;
    }

    // Reject tokens without tokenVersion (legacy tokens)
    if (payload.tokenVersion === undefined || payload.tokenVersion === null) {
      console.log(`⚠️ Rejecting legacy token without tokenVersion for user ${payload.id}`);
      return null;
    }

    return payload as EdgeJwtPayload;
  } catch (error: any) {
    // Log specific error types for debugging
    if (error?.code === 'ERR_JWT_EXPIRED') {
      console.log('⚠️ Edge JWT verification failed: Token expired');
    } else if (error?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.log('⚠️ Edge JWT verification failed: Invalid signature');
    } else if (error?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      console.log(`⚠️ Edge JWT verification failed: ${error.message}`);
    } else {
      console.log(`⚠️ Edge JWT verification failed: ${error?.message || 'Unknown error'}`);
    }
    return null;
  }
}

/**
 * Verify refresh token for Edge Runtime
 * @param token - Refresh token
 * @returns Decoded payload or null if invalid
 */
export async function verifyRefreshJwtEdge(token: string): Promise<EdgeJwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!);
    
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'school-management-system',
      audience: 'school-app',
      algorithms: ['HS256'],
    });

    // Validate refresh token type
    if (payload.type !== 'refresh') {
      console.error('Token is not a refresh token');
      return null;
    }

    return payload as EdgeJwtPayload;
  } catch (error: any) {
    console.log(`⚠️ Edge refresh token verification failed: ${error?.message || 'Unknown error'}`);
    return null;
  }
}

