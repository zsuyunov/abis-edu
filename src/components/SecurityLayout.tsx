/**
 * Security Layout Component
 * Provides CSP-compliant script loading and nonce support
 */

import { useCSPNonce } from '@/lib/security/csp-nonce';
import { SecureScript } from './SecureScript';

interface SecurityLayoutProps {
  children: React.ReactNode;
}

export function SecurityLayout({ children }: SecurityLayoutProps) {
  const nonce = useCSPNonce();

  return (
    <>
      {/* Security utilities script */}
      <SecureScript src="/js/security.js" strategy="afterInteractive" />
      
      {/* CSRF token meta tag */}
      <meta name="csrf-token" content={nonce || ''} />
      
      {/* Main content */}
      {children}
    </>
  );
}

/**
 * CSP-compliant inline script wrapper
 * Only use for critical functionality that must be inline
 */
export function CriticalInlineScript({ children }: { children: string }) {
  const nonce = useCSPNonce();

  return (
    <script
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}
