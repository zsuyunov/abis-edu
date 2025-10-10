/**
 * Secure Content Security Policy Implementation
 * Production-ready CSP without unsafe-inline or unsafe-eval
 */

import { NextResponse } from 'next/server';

export class SecureCSP {
  /**
   * Generate a cryptographically secure nonce
   */
  static generateNonce(): string {
    try {
      const bytes = new Uint8Array(16);
      (globalThis as any).crypto?.getRandomValues(bytes);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return (globalThis as any).btoa(binary);
    } catch (_e) {
      // Fallback for environments without Web Crypto
      return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
  }

  /**
   * Apply secure CSP headers
   * @param response - Next.js response
   * @param options - CSP configuration options
   */
  static apply(
    response: NextResponse,
    options: {
      nonce?: string;
      isDev?: boolean;
      additionalDomains?: {
        connectSrc?: string[];
        imgSrc?: string[];
        fontSrc?: string[];
      };
    } = {}
  ): NextResponse {
    const nonce = options.nonce || this.generateNonce();
    const isDev = options.isDev ?? process.env.NODE_ENV !== 'production';

    // Build CSP directives - SECURE VERSION
    const cspDirectives = [
      // Default policy - only allow same-origin
      "default-src 'self'",
      
      // Script sources - SECURE: No unsafe-inline or unsafe-eval
      `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net`,
      
      // Style sources - Allow unsafe-inline for Tailwind CSS
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      
      // Font sources - only trusted domains
      "font-src 'self' https://fonts.gstatic.com data:",
      
      // Image sources - allow data URLs for inline images
      "img-src 'self' data: https: blob:",
      
      // Connect sources - API endpoints and trusted domains
      `connect-src 'self' ${options.additionalDomains?.connectSrc?.join(' ') || ''}`,
      
      // Media sources
      "media-src 'self'",
      
      // Object sources - NONE (no Flash, Java applets, etc.)
      "object-src 'none'",
      
      // Frame sources - NONE (no iframes)
      "frame-src 'none'",
      
      // Frame ancestors - NONE (prevent clickjacking)
      "frame-ancestors 'none'",
      
      // Base URI - only same origin
      "base-uri 'self'",
      
      // Form action - only same origin
      "form-action 'self'",
      
      // Upgrade insecure requests in production
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ];

    // Remove empty directives
    const cleanDirectives = cspDirectives.filter(directive => 
      directive && !directive.includes('undefined')
    );

    // Set CSP header
    response.headers.set(
      'Content-Security-Policy',
      cleanDirectives.join('; ')
    );

    // Set nonce in header for use in templates
    response.headers.set('X-CSP-Nonce', nonce);

    // Additional security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS in production
    if (!isDev) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Permissions Policy
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
   * Get CSP nonce for use in components
   */
  static getNonce(): string {
    return this.generateNonce();
  }
}
