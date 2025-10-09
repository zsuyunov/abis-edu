/**
 * Security Module - Main Export
 * Exports all security utilities for easy import
 */

export { PasswordService } from './password';
export { TokenService } from './tokens';
export { SecurityLogger } from './logger';
export { MFAService } from './mfa';
export { RateLimiter, RateLimitPresets } from './rate-limit';
export { CSRFProtection } from './csrf';
export { SecurityHeaders } from './headers';
export { SecurityMonitoring } from './monitoring';
export { withCSRF, withCSRFLogging, validateCSRF } from './csrf-middleware';

// Input validation exports
export {
  sanitizeSQL,
  sanitizeFilePath,
  sanitizeHTML,
  sanitizeRateLimitKey,
  detectSuspiciousInput,
  emailSchema,
  urlSchema,
  gradeSchema,
  dateStringSchema,
  futureDateSchema,
  usernameSchema,
  fileUploadSchema,
  jsonSchema,
  idArraySchema,
  paginationSchema,
  searchSchema,
  ValidationPatterns,
  integerInRange,
  positiveInteger,
} from './input-validation';

// Re-export types
export type { TokenPayload, RefreshTokenPayload } from './tokens';
export type { RateLimitConfig } from './rate-limit';
export type { SecurityLogData } from './logger';
export type { SecurityAlert } from './monitoring';

