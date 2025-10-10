/**
 * CSRF Token Management Hook
 * 
 * Provides CSRF token fetching and management for protected API routes.
 * Automatically fetches a fresh token and provides utilities for including
 * it in API requests.
 * 
 * Usage:
 * ```tsx
 * const { token, loading, error, refreshToken } = useCsrfToken();
 * 
 * // In your API call:
 * await fetch('/api/grades', {
 *   method: 'POST',
 *   headers: { 
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': token 
 *   },
 *   body: JSON.stringify(data)
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

interface UseCsrfTokenReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

export function useCsrfToken(): UseCsrfTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        console.warn('CSRF token fetch failed with status:', response.status);
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      
      // Check if we got a valid token
      if (data.token) {
        setToken(data.token);
        console.log('✅ CSRF token fetched successfully');
      } else if (data.error) {
        console.warn('⚠️ CSRF token endpoint returned error:', data.error);
        // Don't throw error for unauthenticated state
        setToken(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
      console.error('❌ CSRF token fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken,
  };
}

/**
 * Utility function to get CSRF token directly (for one-off requests)
 * 
 * @returns Promise<string> The CSRF token
 * @throws Error if token fetch fails
 */
export async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf-token', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }

  const data = await response.json();
  return data.token;
}

/**
 * Enhanced fetch wrapper that automatically includes CSRF token
 * 
 * @param url API endpoint URL
 * @param options Fetch options
 * @returns Promise<Response>
 * 
 * Usage:
 * ```tsx
 * import { csrfFetch } from '@/hooks/useCsrfToken';
 * 
 * const response = await csrfFetch('/api/grades', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Only add CSRF token for state-changing methods
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    (options.method || 'GET').toUpperCase()
  );

  if (needsCsrf) {
    try {
      const token = await getCsrfToken();
      console.log(`🔐 Adding CSRF token to ${options.method} ${url}`);
      
      options.headers = {
        ...options.headers,
        'x-csrf-token': token,
      };
    } catch (error) {
      console.error(`❌ Failed to get CSRF token for ${options.method} ${url}:`, error);
      // Continue anyway - the server will reject if CSRF is required
    }
  }

  // Always include credentials for cookies
  options.credentials = options.credentials || 'include';

  return fetch(url, options);
}

