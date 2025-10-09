/**
 * Token Management for JWT Access Tokens and Refresh Tokens
 * Implements OWASP best practices for token-based authentication
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Token configuration from environment variables with secure defaults
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || (() => {
  console.error('CRITICAL: JWT_SECRET not set in environment variables!');
  throw new Error('JWT_SECRET must be configured');
})();

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || (() => {
  console.error('CRITICAL: REFRESH_TOKEN_SECRET not set in environment variables!');
  throw new Error('REFRESH_TOKEN_SECRET must be configured');
})();

// Short-lived access token (15 minutes) - OWASP recommendation
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';

// Longer-lived refresh token (7 days) - stored in httpOnly cookie
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  id: string;
  phone: string;
  role: string;
  name?: string;
  surname?: string;
  branchId?: string | number;
  tokenVersion: number; // For global token invalidation
}

export interface RefreshTokenPayload {
  id: string;
  role: string;
  tokenVersion: number;
  type: 'refresh';
}

export class TokenService {
  /**
   * Generate a short-lived JWT access token
   * @param payload - User data to encode in token
   * @returns JWT access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      payload, 
      ACCESS_TOKEN_SECRET, 
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'school-management-system',
        audience: 'school-app',
      } as jwt.SignOptions
    );
  }

  /**
   * Generate a long-lived refresh token (stored in DB)
   * @param userId - User ID
   * @param userRole - User role
   * @param tokenVersion - Current token version
   * @returns Object with refresh token JWT and token ID
   */
  static generateRefreshToken(userId: string, userRole: string, tokenVersion: number): {
    token: string;
    tokenId: string;
  } {
    const tokenId = crypto.randomBytes(32).toString('hex');
    
    const payload: RefreshTokenPayload = {
      id: userId,
      role: userRole,
      tokenVersion,
      type: 'refresh',
    };

    const token = jwt.sign(
      payload,
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        jwtid: tokenId,
        issuer: 'school-management-system',
        audience: 'school-app',
      } as jwt.SignOptions
    );

    return { token, tokenId };
  }

  /**
   * Verify and decode an access token AND validate tokenVersion from database
   * SECURITY: This prevents old tokens from being used after password reset/logout
   * PRODUCTION-CRITICAL: Always validates tokenVersion against DB to allow forced logout
   * @param token - JWT access token
   * @returns Decoded payload or null if invalid
   */
  static async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: 'school-management-system',
        audience: 'school-app',
      }) as TokenPayload;

      // CRITICAL SECURITY CHECK: Verify tokenVersion against database
      // This allows immediate forced logout when you rotate secrets or increment tokenVersion
      const userTable = decoded.role === 'admin' ? 'admin' 
        : decoded.role === 'teacher' ? 'teacher'
        : decoded.role === 'student' ? 'student'
        : decoded.role === 'parent' ? 'parent'
        : 'user';

      const user = await (prisma as any)[userTable].findUnique({
        where: { id: decoded.id },
        select: { tokenVersion: true }
      });

      // Reject token if user not found or tokenVersion mismatch
      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        console.log(`⚠️ Token rejected: tokenVersion mismatch for user ${decoded.id} (expected: ${user?.tokenVersion}, got: ${decoded.tokenVersion})`);
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Access token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token
   * @returns Decoded payload or null if invalid
   */
  static verifyRefreshToken(token: string): (RefreshTokenPayload & { jti?: string }) | null {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'school-management-system',
        audience: 'school-app',
      }) as RefreshTokenPayload & { jti?: string };
      
      if (decoded.type !== 'refresh') {
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Refresh token verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Hash a refresh token for secure storage in database
   * Uses SHA-256 for one-way hashing
   * @param token - Refresh token to hash
   * @returns Hashed token string
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store a refresh token in the database
   * @param tokenId - Unique token ID
   * @param token - Refresh token JWT
   * @param userId - User ID
   * @param userRole - User role
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   */
  static async storeRefreshToken(
    tokenId: string,
    token: string,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date();
      
      // Parse expiry from REFRESH_TOKEN_EXPIRY (e.g., "7d" -> 7 days)
      const match = REFRESH_TOKEN_EXPIRY.match(/^(\d+)([dhms])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
          case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
          case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
          case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
          case 's': expiresAt.setSeconds(expiresAt.getSeconds() + value); break;
        }
      } else {
        expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
      }

      await (prisma as any).refreshToken.create({
        data: {
          id: tokenId,
          tokenHash,
          userId,
          userRole,
          ipAddress,
          userAgent,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Verify a refresh token exists in database and is not revoked
   * @param token - Refresh token to verify
   * @returns Token record or null if invalid/revoked
   */
  static async verifyRefreshTokenInDB(token: string) {
    try {
      const tokenHash = this.hashToken(token);
      
      const tokenRecord = await (prisma as any).refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!tokenRecord) {
        return null;
      }

      // Check if token is revoked
      if (tokenRecord.revokedAt) {
        return null;
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expiresAt) {
        return null;
      }

      return tokenRecord;
    } catch (error) {
      console.error('Failed to verify refresh token in DB:', error);
      return null;
    }
  }

  /**
   * Revoke a refresh token (mark as used/replaced)
   * @param token - Token to revoke
   * @param replacedBy - ID of the new token that replaces this one
   */
  static async revokeRefreshToken(token: string, replacedBy?: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      
      await (prisma as any).refreshToken.update({
        where: { tokenHash },
        data: {
          revokedAt: new Date(),
          replacedBy,
        },
      });
    } catch (error) {
      console.error('Failed to revoke refresh token:', error);
    }
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on password change or logout all devices)
   * @param userId - User ID
   * @param userRole - User role
   */
  static async revokeAllUserTokens(userId: string, userRole: string): Promise<void> {
    try {
      await (prisma as any).refreshToken.updateMany({
        where: {
          userId,
          userRole,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to revoke all user tokens:', error);
    }
  }

  /**
   * Clean up expired refresh tokens (run periodically)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      await (prisma as any).refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  }
}

