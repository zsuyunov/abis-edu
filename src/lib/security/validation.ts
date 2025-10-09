/**
 * Input Validation Schemas
 * Uses Zod for runtime type checking and validation
 * Protects against injection attacks and malformed input
 */

import { z } from 'zod';

// Phone number validation (Uzbekistan format)
// Note: We keep the phone as-is to match database format
const phoneSchema = z.string()
  .regex(/^\+?998[0-9]{9}$|^[0-9]{9}$/, 'Invalid phone number format')
  .transform(phone => {
    // Ensure phone has +998 prefix for consistency
    if (phone.startsWith('+998')) {
      return phone;
    } else if (phone.startsWith('998')) {
      return '+' + phone;
    } else {
      return '+998' + phone;
    }
  });

// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

// Login request validation
export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  // mfaCode: z.string().regex(/^[0-9]{6}$/).optional(), // MFA disabled for now
});

export type LoginInput = z.infer<typeof loginSchema>;

// Refresh token request validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Password change validation
export const passwordChangeSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// Password reset request validation
export const passwordResetRequestSchema = z.object({
  phone: phoneSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

// Password reset completion validation
export const passwordResetCompleteSchema = z.object({
  token: z.string().min(32),
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordResetCompleteInput = z.infer<typeof passwordResetCompleteSchema>;

// MFA setup validation (DISABLED - uncomment when enabling MFA)
/*
export const mfaSetupSchema = z.object({
  userId: z.string(),
  userRole: z.string(),
});

export type MFASetupInput = z.infer<typeof mfaSetupSchema>;
*/

// MFA verification validation (DISABLED - uncomment when enabling MFA)
/*
export const mfaVerifySchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'MFA code must be 6 digits'),
  secret: z.string(),
});

export type MFAVerifyInput = z.infer<typeof mfaVerifySchema>;
*/

/**
 * Sanitize string input to prevent XSS
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize object recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      result[key as keyof T] = value;
    }
  }
  
  return result;
}

