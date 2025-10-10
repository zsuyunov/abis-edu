/**
 * Secure Script Component
 * Automatically adds nonce to scripts for CSP compliance
 */

'use client';

import { useNonce } from '@/lib/security/csp-nonce-provider';
import Script from 'next/script';

interface SecureScriptProps {
  src?: string;
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive' | 'worker';
  children?: string;
  id?: string;
  onLoad?: () => void;
  onError?: () => void;
  [key: string]: any;
}

export function SecureScript({ 
  children, 
  nonce: propNonce,
  ...props 
}: SecureScriptProps & { nonce?: string }) {
  const contextNonce = useNonce();
  const nonce = propNonce || contextNonce;

  if (children) {
    // Inline script
    return (
      <script {...props} nonce={nonce || undefined}>
        {children}
      </script>
    );
  }

  // External script
  return (
    <Script {...props} nonce={nonce || undefined} />
  );
}

/**
 * Hook to get nonce for manual script injection
 */
export function useSecureNonce(): string | null {
  return useNonce();
}
