/**
 * ⚠️ MFA (Multi-Factor Authentication) Service - CURRENTLY DISABLED
 * 
 * This module provides TOTP-based MFA functionality.
 * To enable MFA:
 * 1. Uncomment the import in src/app/api/auth/login/route.ts
 * 2. Uncomment the MFA logic in the login route
 * 3. Install speakeasy: npm install speakeasy
 * 4. Install qrcode types: npm install @types/qrcode
 * 5. Test with an authenticator app (Google Authenticator, Authy, etc.)
 */

/*
import * as speakeasy from 'speakeasy';

export class MFAService {
  // Generate a new MFA secret for a user
  static generateSecret(username: string): {
    secret: string;
    qrCodeUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `School Management (${username})`,
      issuer: 'School Management System',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
    };
  }

  // Verify a TOTP token
  static verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });
  }

  // Generate cryptographically secure backup codes (for account recovery)
  // PRODUCTION-READY: Uses crypto.randomBytes instead of Math.random
  static generateBackupCodes(count: number = 10): string[] {
    const crypto = require('crypto');
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 6 random bytes and encode as base64url (8-9 chars)
      const code = crypto.randomBytes(6).toString('base64url').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
*/

/**
 * MFA Secret Encryption/Decryption (PRODUCTION-READY)
 * Encrypts MFA secrets at rest using AES-256-GCM
 * Set MFA_ENCRYPTION_KEY in .env (32-byte base64 string)
 */
/*
import * as crypto from 'crypto';

class MFAEncryption {
  private static getKey(): Buffer {
    const key = process.env.MFA_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('MFA_ENCRYPTION_KEY not set in environment');
    }
    return Buffer.from(key, 'base64');
  }

  static encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  static decrypt(ciphertext: string): string {
    const key = this.getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
*/

// Placeholder export to prevent import errors
export class MFAService {
  static generateSecret(username: string) {
    throw new Error('MFA is currently disabled. See comments in this file to enable.');
  }

  static verifyToken(token: string, secret: string): boolean {
    throw new Error('MFA is currently disabled. See comments in this file to enable.');
  }

  static generateBackupCodes(count: number = 10): string[] {
    throw new Error('MFA is currently disabled. See comments in this file to enable.');
  }

  // Encryption methods ready for when MFA is enabled
  /*
  static encryptSecret(secret: string): string {
    return MFAEncryption.encrypt(secret);
  }

  static decryptSecret(encrypted: string): string {
    return MFAEncryption.decrypt(encrypted);
  }
  */
}
