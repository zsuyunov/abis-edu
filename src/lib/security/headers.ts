/**
 * Security Headers Configuration
 * Implements OWASP recommended security headers with secure CSP
 * PRODUCTION-HARDENED: No unsafe-inline or unsafe-eval
 */

import { NextResponse } from 'next/server';
import { SecureCSP } from './secure-csp';

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
    // Use secure CSP implementation
    return SecureCSP.apply(response, {
      nonce: options.nonce,
      isDev: process.env.NODE_ENV !== 'production',
      additionalDomains: {
        connectSrc: options.additionalConnectSrc,
      }
    });
  }

  /**
   * Get CSP nonce for inline scripts
   * @returns Nonce string
   */
  static generateNonce(): string {
    return SecureCSP.generateNonce();
  }
}

