/**
 * API Client with CSRF Protection
 * 
 * A centralized API client that automatically handles CSRF tokens
 * for all state-changing requests.
 * 
 * Usage:
 * ```tsx
 * import { apiClient } from '@/lib/api-client';
 * 
 * // POST request with automatic CSRF
 * const response = await apiClient.post('/api/grades', {
 *   studentId: '123',
 *   value: 95
 * });
 * 
 * // GET request (no CSRF needed)
 * const data = await apiClient.get('/api/grades');
 * ```
 */

import { getCsrfToken } from '@/hooks/useCsrfToken';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * GET request (no CSRF needed)
   */
  async get<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' }, false);
  }

  /**
   * POST request (with CSRF)
   */
  async post<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, true);
  }

  /**
   * PUT request (with CSRF)
   */
  async put<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, true);
  }

  /**
   * DELETE request (with CSRF)
   */
  async delete<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    }, true);
  }

  /**
   * PATCH request (with CSRF)
   */
  async patch<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, true);
  }

  /**
   * Upload file (with CSRF)
   * For FormData uploads (doesn't set Content-Type to let browser set boundary)
   */
  async upload<T = any>(url: string, formData: FormData, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const csrfToken = await getCsrfToken();
    
    // Add CSRF token to FormData
    formData.append('_csrf', csrfToken);

    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: formData,
    }, false, true); // Don't set JSON headers for FormData
  }

  /**
   * Core request method
   */
  private async request<T>(
    url: string,
    options: RequestInit,
    needsCsrf: boolean,
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const fullURL = `${this.baseURL}${url}`;
      
      // Set up headers
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
      };

      // Add Content-Type for JSON requests (not FormData)
      if (!isFormData && options.method !== 'GET' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Add CSRF token if needed
      if (needsCsrf) {
        const csrfToken = await getCsrfToken();
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(fullURL, {
        ...options,
        headers,
        credentials: 'include', // Always include cookies
      });

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          error: data?.error || data?.message || `Request failed with status ${response.status}`,
          success: false,
        };
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        success: false,
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Also export the class for custom instances if needed
export default ApiClient;

