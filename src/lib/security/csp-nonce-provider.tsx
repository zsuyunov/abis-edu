/**
 * CSP Nonce Provider for React Components
 * Provides nonce values for inline scripts and styles to work with secure CSP
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';

interface NonceContextType {
  nonce: string | null;
}

const NonceContext = createContext<NonceContextType>({ nonce: null });

export function NonceProvider({ children, nonce }: { children: ReactNode; nonce: string | null }) {
  return (
    <NonceContext.Provider value={{ nonce }}>
      {children}
    </NonceContext.Provider>
  );
}

export function useNonce(): string | null {
  const { nonce } = useContext(NonceContext);
  return nonce;
}

/**
 * Script component that automatically adds nonce
 */
export function NonceScript({ 
  children, 
  ...props 
}: { 
  children?: string; 
  [key: string]: any;
}) {
  const nonce = useNonce();
  
  return (
    <script {...props} nonce={nonce}>
      {children}
    </script>
  );
}

/**
 * Style component that automatically adds nonce
 */
export function NonceStyle({ 
  children, 
  ...props 
}: { 
  children?: string; 
  [key: string]: any;
}) {
  const nonce = useNonce();
  
  return (
    <style {...props} nonce={nonce}>
      {children}
    </style>
  );
}
