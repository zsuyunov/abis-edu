/**
 * Content Security Policy Configuration
 * Production-ready CSP that allows Next.js while maintaining security
 */

export interface CSPConfig {
  isDev: boolean;
  nonce: string;
  additionalDomains?: string[];
}

/**
 * Generate production-ready CSP directives
 */
export function generateCSPDirectives(config: CSPConfig): string[] {
  const { isDev, nonce, additionalDomains = [] } = config;

  // Base domains
  const baseDomains = ["'self'", ...additionalDomains];
  
  // Script sources
  const scriptDomains = [
    ...baseDomains,
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ];

  // Style sources  
  const styleDomains = [
    ...baseDomains,
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  // Image sources
  const imgDomains = [
    ...baseDomains,
    'https://ik.imagekit.io',
    'https://images.unsplash.com',
    'data:',
  ];

  // Font sources
  const fontDomains = [
    ...baseDomains,
    'https://fonts.gstatic.com',
    'data:',
  ];

  // Connect sources (for API calls)
  const connectDomains = [
    ...baseDomains,
    'https://api.upstash.io',
    'https://neon.tech',
  ];

  // Generate script-src directive
  let scriptSrc: string;
  if (isDev) {
    // Development: Allow unsafe-inline for debugging
    scriptSrc = `script-src ${scriptDomains.join(' ')} 'nonce-${nonce}' 'unsafe-inline'`;
  } else {
    // Production: Strict CSP with nonce only
    scriptSrc = `script-src ${scriptDomains.join(' ')} 'nonce-${nonce}'`;
  }

  // Generate style-src directive
  let styleSrc: string;
  if (isDev) {
    // Development: Allow unsafe-inline for debugging
    styleSrc = `style-src ${styleDomains.join(' ')} 'nonce-${nonce}' 'unsafe-inline'`;
  } else {
    // Production: Strict CSP with nonce only
    styleSrc = `style-src ${styleDomains.join(' ')} 'nonce-${nonce}'`;
  }

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    `img-src ${imgDomains.join(' ')}`,
    `font-src ${fontDomains.join(' ')}`,
    `connect-src ${connectDomains.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
}

/**
 * Generate CSP header value
 */
export function generateCSPHeader(config: CSPConfig): string {
  const directives = generateCSPDirectives(config);
  return directives.join('; ');
}
