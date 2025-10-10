/**
 * CSP Nonce Wrapper - Server Component
 * Extracts nonce from response headers and provides it to client components
 */

import { headers } from 'next/headers';
import { NonceProvider } from '@/lib/security/csp-nonce-provider';

interface CSPNonceWrapperProps {
  children: React.ReactNode;
}

export default function CSPNonceWrapper({ children }: CSPNonceWrapperProps) {
  // Get nonce from response headers (set by SecurityHeaders.apply)
  const headersList = headers();
  const nonce = headersList.get('X-CSP-Nonce');

  return (
    <NonceProvider nonce={nonce}>
      {children}
    </NonceProvider>
  );
}
