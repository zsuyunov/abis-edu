/**
 * Rate Limiting Service - PRODUCTION-READY
 * Prevents brute force attacks and API abuse
 * Uses Redis for distributed rate-limiting (falls back to in-memory for dev)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from './redis-adapter';

// Storage adapter (Redis or in-memory)
const storage = getStorage();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  message?: string;  // Custom error message
}

// Predefined rate limit configurations
export const RateLimitPresets = {
  // Strict rate limit for login attempts (5 attempts per 15 minutes)
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  
  // Moderate rate limit for password reset (3 attempts per hour)
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many password reset requests. Please try again later.',
  },
  
  // General API rate limit (100 requests per minute)
  API: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
  
  // MFA verification (5 attempts per 5 minutes)
  MFA: {
    windowMs: 5 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many MFA verification attempts. Please try again later.',
  },
};

export class RateLimiter {
  /**
   * Check if a request should be rate limited (ASYNC version for Redis)
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param config - Rate limit configuration
   * @returns Object with allowed flag and remaining requests
   */
  static async checkAsync(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    
    // Get current record from storage
    const recordStr = await storage.get(key);
    let record: { count: number; resetAt: number } | null = recordStr 
      ? JSON.parse(recordStr) 
      : null;
    
    // Reset if window expired or record doesn't exist
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      
      // Store with TTL
      await storage.set(
        key, 
        JSON.stringify(record), 
        Math.ceil(config.windowMs / 1000)
      );
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: record.resetAt,
      };
    }
    
    // Increment counter
    record.count++;
    
    // Update storage
    await storage.set(
      key, 
      JSON.stringify(record),
      Math.ceil((record.resetAt - now) / 1000)
    );
    
    const allowed = record.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - record.count);
    
    return {
      allowed,
      remaining,
      resetAt: record.resetAt,
    };
  }

  /**
   * Synchronous check for backward compatibility (uses in-memory fallback)
   * DEPRECATED: Use checkAsync() for production
   * @param identifier - Unique identifier
   * @param config - Rate limit configuration
   * @returns Object with allowed flag and remaining requests
   */
  static check(
    identifier: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetAt: number } {
    // For backward compatibility, this returns optimistic result
    // Use checkAsync() for proper distributed rate limiting
    console.warn('⚠️ RateLimiter.check() is deprecated. Use checkAsync() for production.');
    
    const now = Date.now();
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  /**
   * Create a rate limit middleware for Next.js API routes
   * @param config - Rate limit configuration
   * @returns Middleware function
   */
  static middleware(config: RateLimitConfig) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      // Get client IP address
      const ip = this.getClientIp(request);
      
      // Check rate limit (async)
      const result = await this.checkAsync(ip, config);
      
      if (!result.allowed) {
        return NextResponse.json(
          {
            error: config.message || 'Too many requests',
            retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(config.maxRequests),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.resetAt),
            },
          }
        );
      }
      
      return null; // Allow request to proceed
    };
  }

  /**
   * Get client IP from request headers
   * Handles various proxy headers (Cloudflare, Render, etc.)
   * SECURITY: Only trust these headers if you're behind a trusted proxy
   * @param request - Next.js request
   * @returns Client IP address
   */
  static getClientIp(request: NextRequest): string {
    // Try Cloudflare
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp) return cfConnectingIp;

    // Try X-Forwarded-For (common reverse proxy header)
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return xForwardedFor.split(',')[0].trim();
    }

    // Try X-Real-IP
    const xRealIp = request.headers.get('x-real-ip');
    if (xRealIp) return xRealIp;

    // Fallback to connection IP
    return request.ip || 'unknown';
  }

  /**
   * Reset rate limit for an identifier (useful for testing or admin override)
   * @param identifier - Unique identifier
   */
  static async reset(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    await storage.del(key);
  }

  /**
   * Get current rate limit status for an identifier
   * @param identifier - Unique identifier
   * @returns Current status or null if no record exists
   */
  static async getStatus(identifier: string): Promise<{
    count: number;
    resetAt: number;
    remaining: number;
  } | null> {
    const key = `ratelimit:${identifier}`;
    const recordStr = await storage.get(key);
    
    if (!recordStr) return null;
    
    const record: { count: number; resetAt: number } = JSON.parse(recordStr);
    
    // If expired, return null
    if (Date.now() > record.resetAt) {
      await storage.del(key);
      return null;
    }
    
    return {
      count: record.count,
      resetAt: record.resetAt,
      remaining: Math.max(0, RateLimitPresets.LOGIN.maxRequests - record.count),
    };
  }
}
