/**
 * Legacy Auth Service - DEPRECATED
 * This file is maintained for backward compatibility only
 * New code should use /lib/security/* modules
 */

import { PasswordService, TokenService } from './security';
import type { TokenPayload } from './security';

// Re-export UserPayload type for backward compatibility
export type UserPayload = TokenPayload;

/**
 * @deprecated Use PasswordService and TokenService from @/lib/security instead
 */
export class AuthService {
  /**
   * @deprecated Use PasswordService.hash() instead
   */
  static async hashPassword(password: string): Promise<string> {
    return await PasswordService.hash(password);
  }

  /**
   * @deprecated Use PasswordService.verify() instead
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await PasswordService.verify(password, hashedPassword);
  }

  /**
   * @deprecated Use TokenService.generateAccessToken() instead
   */
  static generateToken(payload: UserPayload): string {
    return TokenService.generateAccessToken(payload);
  }

  /**
   * @deprecated Use TokenService.verifyAccessToken() instead
   */
  static async verifyToken(token: string): Promise<UserPayload | null> {
    return await TokenService.verifyAccessToken(token);
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authorization: string | null): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.split(' ')[1];
  }

  /**
   * @deprecated Use TokenService.generateAccessToken() instead
   */
  static generateSessionToken(payload: UserPayload): string {
    return this.generateToken(payload);
  }
}

// Named export for compatibility
export const auth = AuthService;

// Named exports for direct function access
export const verifyToken = AuthService.verifyToken;
export const generateToken = AuthService.generateToken;
export const hashPassword = AuthService.hashPassword;
export const verifyPassword = AuthService.verifyPassword;