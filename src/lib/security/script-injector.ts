/**
 * Script Injector for CSP Nonce Support
 * Injects nonces into Next.js generated scripts
 */

import { NextRequest, NextResponse } from 'next/server';

export function injectNoncesIntoResponse(response: NextResponse, nonce: string): NextResponse {
  // Clone the response to modify it
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // Add nonce to response headers for client-side access
  newResponse.headers.set('X-CSP-Nonce', nonce);

  return newResponse;
}

/**
 * Middleware helper to inject nonces into HTML responses
 */
export function processHtmlResponse(html: string, nonce: string): string {
  // Inject nonce into script tags that don't already have one
  let processedHtml = html.replace(
    /<script(?![^>]*nonce=)([^>]*)>/gi,
    `<script$1 nonce="${nonce}">`
  );

  // Inject nonce into style tags that don't already have one
  processedHtml = processedHtml.replace(
    /<style(?![^>]*nonce=)([^>]*)>/gi,
    `<style$1 nonce="${nonce}">`
  );

  // Add nonce to Next.js script tags
  processedHtml = processedHtml.replace(
    /<script[^>]*src="\/_next\/static[^"]*"[^>]*>/gi,
    (match) => {
      if (!match.includes('nonce=')) {
        return match.replace('>', ` nonce="${nonce}">`);
      }
      return match;
    }
  );

  return processedHtml;
}
