import { NextRequest, NextResponse } from 'next/server';
import type { RouteHandler } from './authenticateJWT';
import { RateLimiter, RateLimitPresets, type RateLimitConfig } from '@/lib/security/rate-limit';

export function rateLimit(config: RateLimitConfig) {
  return function (handler: RouteHandler): RouteHandler {
    return async function (request: NextRequest, context?: any, locals?: any) {
      const ip = RateLimiter.getClientIp(request);
      const res = await RateLimiter.checkAsync(`api:${ip}:${new URL(request.url).pathname}`, config);
      if (!res.allowed) {
        return NextResponse.json(
          { error: config.message || 'Too many requests', retryAfter: Math.ceil((res.resetAt - Date.now()) / 1000) },
          { status: 429, headers: { 'Retry-After': String(Math.ceil((res.resetAt - Date.now()) / 1000)) } }
        );
      }
      return handler(request, context, locals);
    };
  };
}

export const RatePresets = RateLimitPresets;


