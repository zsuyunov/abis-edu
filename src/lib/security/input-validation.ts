/**
 * Input Validation Helpers
 * Additional validation beyond Zod schemas
 * Prevents injection attacks and malicious input
 */

import { z } from 'zod';

/**
 * Sanitize SQL-like input (prevent SQL injection in raw queries)
 * NOTE: Use Prisma parameterized queries instead when possible
 */
export function sanitizeSQL(input: string): string {
  // Remove SQL keywords and special characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .trim();
}

/**
 * Validate and sanitize file paths (prevent directory traversal)
 */
export function sanitizeFilePath(path: string): string {
  // Remove directory traversal attempts
  return path
    .replace(/\.\./g, '') // Remove ../
    .replace(/\\/g, '/') // Normalize slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
}

/**
 * Validate email format (stricter than basic regex)
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(254, 'Email too long') // RFC 5321
  .refine((email) => {
    // Additional checks
    const [local, domain] = email.split('@');
    if (!local || !domain) return false;
    if (local.length > 64) return false; // RFC 5321
    if (domain.length > 253) return false; // RFC 1035
    return true;
  }, 'Invalid email structure');

/**
 * Validate URL format and check for malicious URLs
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Block javascript: and data: protocols (XSS vectors)
      if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, 'URL contains malicious protocol');

/**
 * Validate integer with range
 */
export function integerInRange(min: number, max: number) {
  return z
    .number()
    .int('Must be an integer')
    .min(min, `Must be at least ${min}`)
    .max(max, `Must be at most ${max}`);
}

/**
 * Validate positive integer
 */
export const positiveInteger = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive');

/**
 * Validate grade value (0-100)
 */
export const gradeSchema = integerInRange(0, 100);

/**
 * Validate date string
 */
export const dateStringSchema = z
  .string()
  .refine((date) => {
    const parsed = Date.parse(date);
    return !isNaN(parsed);
  }, 'Invalid date format')
  .transform((date) => new Date(date));

/**
 * Validate future date (for exam dates, etc.)
 */
export function futureDateSchema() {
  return dateStringSchema.refine(
    (date) => date > new Date(),
    'Date must be in the future'
  );
}

/**
 * Validate username (alphanumeric + underscore/hyphen only)
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

/**
 * Validate file upload
 */
export function fileUploadSchema(options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
} = {}) {
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'];

  return z.object({
    name: z.string().min(1, 'File name required'),
    size: z.number().max(maxSize, `File too large (max ${maxSize / 1024 / 1024}MB)`),
    type: z.string().refine(
      (type) => allowedTypes.includes(type),
      `File type must be one of: ${allowedTypes.join(', ')}`
    ),
  });
}

/**
 * Validate JSON string
 */
export function jsonSchema<T>(schema: z.ZodType<T>) {
  return z
    .string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON',
        });
        return z.NEVER;
      }
    })
    .pipe(schema);
}

/**
 * Validate array of IDs
 */
export const idArraySchema = z
  .array(z.string().uuid('Invalid ID format'))
  .min(1, 'At least one ID required')
  .max(100, 'Too many IDs (max 100)');

/**
 * Sanitize HTML input (for rich text editors)
 * NOTE: Use a proper HTML sanitizer library like DOMPurify for production
 */
export function sanitizeHTML(html: string): string {
  // Basic sanitization - use DOMPurify for real applications
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .trim();
}

/**
 * Validate pagination parameters
 */
export const paginationSchema = z.object({
  page: positiveInteger.optional().default(1),
  limit: integerInRange(1, 100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Validate search query
 */
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query required').max(100, 'Search query too long'),
  filters: z.record(z.any()).optional(),
  pagination: paginationSchema.optional(),
});

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Phone number (Uzbekistan)
  phone: /^\+?998[0-9]{9}$|^[0-9]{9}$/,
  
  // UUID
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // Alphanumeric
  alphanumeric: /^[a-zA-Z0-9]+$/,
  
  // Hex color
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  
  // IP address
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
};

/**
 * Validate rate limit key (prevent injection)
 */
export function sanitizeRateLimitKey(key: string): string {
  // Only allow alphanumeric, colon, and hyphen
  return key.replace(/[^a-zA-Z0-9:-]/g, '');
}

/**
 * Check for suspicious patterns in user input
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /on\w+=/i, // Event handlers
    /eval\(/i, // Eval function
    /expression\(/i, // CSS expressions
    /import\s/i, // ES6 imports
    /\.\.\//,  // Directory traversal
    /UNION.*SELECT/i, // SQL injection
    /DROP.*TABLE/i, // SQL injection
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

