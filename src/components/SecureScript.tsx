/**
 * CSP-compliant Script component with nonce support
 * Use this instead of <script> tags for inline scripts
 */

import { useCSPNonce } from '@/lib/security/csp-nonce';

interface SecureScriptProps extends React.ScriptHTMLAttributes<HTMLScriptElement> {
  children?: React.ReactNode;
  src?: string;
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive';
}

export function SecureScript({ 
  children, 
  src, 
  strategy = 'afterInteractive',
  ...props 
}: SecureScriptProps) {
  const nonce = useCSPNonce();

  // For external scripts, use Next.js Script component
  if (src) {
    return (
      <script
        {...props}
        src={src}
        nonce={nonce || undefined}
        data-strategy={strategy}
      />
    );
  }

  // For inline scripts, use nonce
  return (
    <script
      {...props}
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={children ? { __html: String(children) } : undefined}
    />
  );
}

/**
 * CSP-compliant inline script for critical functionality
 * Only use when absolutely necessary
 */
export function CriticalScript({ children, ...props }: Omit<SecureScriptProps, 'src'>) {
  const nonce = useCSPNonce();

  return (
    <script
      {...props}
      nonce={nonce || undefined}
      dangerouslySetInnerHTML={{ __html: String(children) }}
    />
  );
}
