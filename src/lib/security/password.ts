/**
 * Password Security Utilities
 * Uses Argon2 for password hashing - more secure than bcrypt
 * Argon2 is the winner of the Password Hashing Competition and recommended by OWASP
 */

import * as argon2 from 'argon2';

export class PasswordService {
  /**
   * Hash a password using Argon2id (hybrid mode - best of Argon2i and Argon2d)
   * @param password - Plain text password
   * @returns Hashed password string
   */
  static async hash(password: string): Promise<string> {
    try {
      // Argon2id with recommended parameters for 2024
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,       // 3 iterations
        parallelism: 4,    // 4 parallel threads
      });
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns True if password matches, false otherwise
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
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
      return argon2.needsRehash(hash);
    } catch (error) {
      return false;
    }
  }
}

