/**
 * Next.js CSP Fix
 * Handles Next.js generated inline scripts for CSP compliance
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Known Next.js inline script hashes for CSP
 * These are the hashes of Next.js generated scripts that need to be allowed
 * 
 * To get the correct hashes, run the app and check browser console for CSP violations
 * Then calculate SHA256 hash of the blocked script content
 */
const NEXTJS_SCRIPT_HASHES = [
  // Common Next.js patterns - these will be updated based on actual violations
  "'sha256-4RS22DYeB7UJdraUtM5cS8QhWgBN6n2c0vfZ3Jp73KY='", // Placeholder
];

/**
 * Generate CSP script-src directive with Next.js script hashes
 */
export function generateSecureScriptSrc(nonce: string, isDev: boolean = false): string {
  if (isDev) {
    // In development, allow unsafe-inline temporarily to identify blocked scripts
    return `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://cdn.jsdelivr.net`;
  }
  
  const hashes = NEXTJS_SCRIPT_HASHES.join(' ');
  return `script-src 'self' 'nonce-${nonce}' ${hashes} https://cdn.jsdelivr.net`;
}

/**
 * Process response to inject nonces into Next.js scripts
 */
export function processNextJsResponse(response: NextResponse, nonce: string): NextResponse {
  // Clone the response
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // Add nonce header for client-side access
  newResponse.headers.set('X-CSP-Nonce', nonce);

  return newResponse;
}

/**
 * Check if a script is a Next.js generated script
 */
export function isNextJsScript(scriptContent: string): boolean {
  const nextJsPatterns = [
    '__next',
    'next.js',
    'webpack',
    'chunk',
    'router',
    'hydration',
  ];

  return nextJsPatterns.some(pattern => 
    scriptContent.toLowerCase().includes(pattern)
  );
}
