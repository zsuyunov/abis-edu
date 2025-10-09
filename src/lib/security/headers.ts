/**
 * Security Headers Configuration
 * Implements OWASP recommended security headers
 * PRODUCTION-HARDENED: Removed unsafe-inline and unsafe-eval from CSP
 */

import { NextResponse } from 'next/server';
// Note: Do not import Node 'crypto' here; middleware runs on Edge runtime

export class SecurityHeaders {
  /**
   * Apply production-grade security headers to a response
   * @param response - Next.js response
   * @param options - Optional nonce and additional CSP directives
   * @returns Response with security headers
   */
  static apply(
    response: NextResponse, 
    options: { 
      nonce?: string;
      additionalConnectSrc?: string[];
    } = {}
  ): NextResponse {
    // Generate nonce for inline scripts (if not provided)
    const nonce = options.nonce || this.generateNonce();
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Build connect-src with custom domains if provided
    const connectSrcDomains = ["'self'"];
    if (options.additionalConnectSrc) {
      connectSrcDomains.push(...options.additionalConnectSrc);
    }
    
    // Content Security Policy (CSP)
    // In development, allow unsafe-inline/eval to enable Next.js dev features and hydration
    // In production, require nonces and avoid unsafe directives
    const scriptSrc = isDev
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net`
      : `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`;
    const styleSrc = isDev
      ? `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
      : `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`;

    const cspDirectives = [
      "default-src 'self'",
      scriptSrc,
      styleSrc,
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      `connect-src ${connectSrcDomains.join(' ')}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ];
    
    response.headers.set(
      'Content-Security-Policy',
      cspDirectives.join('; ')
    );
    
    // Store nonce in header for use in templates
    response.headers.set('X-CSP-Nonce', nonce);

    // Strict-Transport-Security (HSTS)
    // Force HTTPS for 1 year, include subdomains
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // X-Frame-Options
    // Prevent clickjacking by disallowing iframe embedding
    response.headers.set('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    // Prevent MIME-sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection
    // Enable XSS filter in older browsers
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy
    // Control referrer information sent
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy (formerly Feature-Policy)
    // Restrict browser features
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Remove server information
    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');

    return response;
  }

  /**
   * Get CSP nonce for inline scripts
   * @returns Nonce string
   */
  static generateNonce(): string {
    // Use Web Crypto API for Edge compatibility
    // Generate 16 random bytes and base64-encode them
    try {
      const bytes = new Uint8Array(16);
      (globalThis as any).crypto?.getRandomValues(bytes);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      // btoa is available in Edge runtime
      return (globalThis as any).btoa(binary);
    } catch (_e) {
      // Fallback for environments without Web Crypto (shouldn't happen in Edge)
      return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
  }
}

