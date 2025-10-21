/**
 * Password Security Utilities
 * Uses bcrypt for fast, reliable password hashing in development/serverless environments
 * Backward compatible with existing Argon2 hashes
 * Optimized for performance while maintaining security
 */

import bcrypt from 'bcryptjs';
import * as argon2 from 'argon2';

export class PasswordService {
  /**
   * Hash a password using bcrypt with optimized rounds for speed
   * @param password - Plain text password
   * @returns Hashed password string
   */
  static async hash(password: string): Promise<string> {
    try {
      // Use 8 rounds for faster performance while maintaining security
      // This reduces hashing time from ~100ms to ~25ms per password
      const saltRounds = 8;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against a hash (supports both bcrypt and Argon2)
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns True if password matches, false otherwise
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      // Check if it's an Argon2 hash (starts with $argon2)
      if (hash.startsWith('$argon2')) {
        console.log('🔐 Verifying Argon2 password for existing user');
        const result = await argon2.verify(hash, password);
        console.log('🔍 Password verification result:', result);
        return result;
      }
      
      // Otherwise, assume it's a bcrypt hash
      console.log('🔐 Verifying bcrypt password');
      const result = await bcrypt.compare(password, hash);
      console.log('🔍 Password verification result:', result);
      return result;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Check if password meets minimum security requirements
   * @param password - Password to validate
   * @returns Object with isValid flag and error messages
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    // Optional: Add more complexity requirements if needed
    // For school system, we keep it simple but secure
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a hash needs to be rehashed (e.g., after algorithm update)
   * @param hash - Password hash to check
   * @returns True if hash needs rehashing
   */
  static async needsRehash(hash: string): Promise<boolean> {
    try {
      // For bcrypt, we can check if it uses the current salt rounds
      // This is a simple implementation - always return false for now
      return false;
    } catch (error) {
      return false;
    }
  }
}

