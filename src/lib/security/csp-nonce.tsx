/**
 * CSP Nonce Helper for Next.js Pages
 * Provides nonce generation and injection for Content Security Policy
 * 
 * Usage in pages:
 * import { CSPNonce, useCSPNonce } from '@/lib/security/csp-nonce';
 * 
 * // In your page/layout
 * <CSPNonce>
 *   <script nonce={nonce}>
 *     // inline script
 *   </script>
 * </CSPNonce>
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityHeaders } from './headers';

// Context for nonce
const CSPNonceContext = createContext<string | null>(null);

/**
 * Hook to get CSP nonce in client components
 */
export function useCSPNonce(): string | null {
  return useContext(CSPNonceContext);
}

/**
 * Provider component for CSP nonce
 * Wrap your app with this to enable nonce-based CSP
 */
export function CSPNonceProvider({ children }: { children: React.ReactNode }) {
  const [nonce, setNonce] = useState<string | null>(null);

  useEffect(() => {
    // Get nonce from meta tag or header
    const metaNonce = document.querySelector('meta[property="csp-nonce"]')?.getAttribute('content');
    const headerNonce = document.querySelector('meta[name="x-csp-nonce"]')?.getAttribute('content');
    
    const nonceValue = metaNonce || headerNonce || SecurityHeaders.generateNonce();
    setNonce(nonceValue);
  }, []);

  return (
    <CSPNonceContext.Provider value={nonce}>
      {children}
    </CSPNonceContext.Provider>
  );
}

/**
 * HOC to inject nonce into component props
 */
export function withNonce<P extends { nonce?: string }>(
  Component: React.ComponentType<P>
) {
  return function WithNonceComponent(props: Omit<P, 'nonce'>) {
    const nonce = useCSPNonce();
    return <Component {...(props as P)} nonce={nonce || undefined} />;
  };
}

/**
 * Script component that automatically includes nonce
 * Use this instead of <script> tags for inline scripts
 */
export function NonceScript({ children, ...props }: React.ScriptHTMLAttributes<HTMLScriptElement>) {
  const nonce = useCSPNonce();
  
  return (
    <script {...props} nonce={nonce || undefined}>
      {children}
    </script>
  );
}

/**
 * Style component that automatically includes nonce
 * Use this instead of <style> tags for inline styles
 */
export function NonceStyle({ children, ...props }: React.StyleHTMLAttributes<HTMLStyleElement>) {
  const nonce = useCSPNonce();
  
  return (
    <style {...props} nonce={nonce || undefined}>
      {children}
    </style>
  );
}

/**
 * Server-side nonce generation for Next.js App Router
 * Use in layout.tsx or page.tsx (server components)
 */
export async function generateNonceForPage() {
  // This runs on the server
  const nonce = SecurityHeaders.generateNonce();
  
  return {
    nonce,
    // Meta tag to pass nonce to client
    metaTag: <meta name="x-csp-nonce" content={nonce} key="csp-nonce" />,
  };
}

/**
 * Example usage in root layout:
 * 
 * // app/layout.tsx
 * import { generateNonceForPage } from '@/lib/security/csp-nonce';
 * 
 * export default async function RootLayout({ children }) {
 *   const { nonce, metaTag } = await generateNonceForPage();
 *   
 *   return (
 *     <html>
 *       <head>
 *         {metaTag}
 *       </head>
 *       <body>
 *         <CSPNonceProvider>
 *           {children}
 *         </CSPNonceProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * 
 * // In any component:
 * import { NonceScript } from '@/lib/security/csp-nonce';
 * 
 * function MyComponent() {
 *   return (
 *     <NonceScript>
 *       console.log('This script has a nonce!');
 *     </NonceScript>
 *   );
 * }
 */

