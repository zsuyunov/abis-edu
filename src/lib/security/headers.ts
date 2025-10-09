/**
 * Security Headers Configuration
 * Implements OWASP recommended security headers
 * PRODUCTION-HARDENED: Removed unsafe-inline and unsafe-eval from CSP
 */

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

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
    
    // Build connect-src with custom domains if provided
    const connectSrcDomains = ["'self'"];
    if (options.additionalConnectSrc) {
      connectSrcDomains.push(...options.additionalConnectSrc);
    }
    
    // Content Security Policy (CSP)
    // PRODUCTION-HARDENED: No unsafe-inline or unsafe-eval
    // Use nonces for any inline scripts you must keep
    const cspDirectives = [
      "default-src 'self'",
      // HARDENED: Removed unsafe-inline and unsafe-eval - use nonces for inline scripts
      `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
      // Allow inline styles with nonce-based approach (better than unsafe-inline)
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      // Lock down connect-src to specific domains
      `connect-src ${connectSrcDomains.join(' ')}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'", // Prevent Flash/plugins
      "upgrade-insecure-requests", // Force HTTPS
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
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }
}

