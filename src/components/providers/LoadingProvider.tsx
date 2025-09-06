"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GlobalLoader } from '@/components/GlobalLoader';
import { usePrefetch, useSmartPrefetch } from '@/hooks/usePrefetch';


interface LoadingContextType {
  // Legacy support for existing code
  isLoading: boolean;
  isNavigating: boolean;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  showNavigation: () => void;
  hideNavigation: () => void;
  loadingMessage: string;
  
  // New navigation-aware features
  isDataLoading: boolean;
  setDataLoading: (loading: boolean) => void;
  navigationProgress: number;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  // Legacy state for backward compatibility
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  
  // New navigation-aware state
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const pathname = usePathname();

  // Initialize prefetching hooks
  usePrefetch();
  useSmartPrefetch();

  // ULTRA-INSTANT data preloading for zero loading time
  useEffect(() => {
    // Service worker registration removed for better performance

    const preloadEssentialData = async () => {
      try {
        // Preload only user data for immediate access
        const userResponse = await fetch('/api/auth/me', {
          headers: {
            'Cache-Control': 'max-age=86400, immutable', // 24 hour cache
            'Pragma': 'cache',
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            localStorage.setItem('cached-user-data', JSON.stringify({
              data: userData,
              timestamp: Date.now()
            }));
          }
        }

        // Only preload essential data - dashboard and filter data will be loaded on demand

      } catch (error) {
        // Silent fail - don't block the app
        console.log('Data preload failed:', error);
      }
    };

            // Start preloading after a short delay to avoid blocking initial render
        const timer = setTimeout(preloadEssentialData, 100);
        return () => clearTimeout(timer);
  }, []);

  // Navigation loading effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    if (isNavigating) {
      // Start progress animation
      setNavigationProgress(0);
      progressInterval = setInterval(() => {
        setNavigationProgress(prev => {
          if (prev >= 90) return prev; // Don't complete until navigation is done
          return prev + Math.random() * 15;
        });
      }, 100);

      // Safety timeout to prevent infinite loading (increased to 15s)
      timeoutId = setTimeout(() => {
        setIsNavigating(false);
        setNavigationProgress(100);
      }, 15000);
    } else {
      // Complete progress and reset
      setNavigationProgress(100);
      setTimeout(() => {
        setNavigationProgress(0);
      }, 200);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isNavigating]);

  // Listen to pathname changes for navigation detection - OPTIMIZED
  useEffect(() => {
    // Only show navigation loading for actual page changes, not component re-renders
    const isActualNavigation = pathname !== window.location.pathname;
    
    if (isActualNavigation) {
      setIsNavigating(true);
      
      // Wait for the page to be fully loaded
      const checkPageReady = () => {
        // Check if document is ready and all critical resources are loaded
        if (document.readyState === 'complete') {
          // Additional check for React hydration
          setTimeout(() => {
            setIsNavigating(false);
          }, 100); // Small delay to ensure React has finished rendering
        } else {
          // If not ready, check again
          setTimeout(checkPageReady, 50);
        }
      };

      // Start checking after a minimum delay for UX
      const minDelayTimer = setTimeout(checkPageReady, 300);

      // Safety timeout to prevent infinite loading
      const maxDelayTimer = setTimeout(() => {
        setIsNavigating(false);
      }, 10000);

      return () => {
        clearTimeout(minDelayTimer);
        clearTimeout(maxDelayTimer);
      };
    }
  }, [pathname]);

  // Legacy methods for backward compatibility
  const showLoader = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const showNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const hideNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  const setDataLoadingCallback = useCallback((loading: boolean) => {
    setIsDataLoading(loading);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        // Legacy support
        isLoading,
        isNavigating,
        showLoader,
        hideLoader,
        showNavigation,
        hideNavigation,
        loadingMessage,
        
        // New features
        isDataLoading,
        setDataLoading: setDataLoadingCallback,
        navigationProgress,
      }}
    >
      {children}
      <GlobalLoader />
      
      {/* Legacy full-screen loader for backward compatibility */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-700 dark:text-gray-300">{loadingMessage}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Hook for data fetching with loading states
export const useDataQuery = <T,>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchInterval?: number;
  }
) => {
  const { setDataLoading } = useLoading();
  
  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.gcTime ?? 10 * 60 * 1000,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });

  // Update global loading state
  useEffect(() => {
    setDataLoading(query.isLoading || query.isFetching);
  }, [query.isLoading, query.isFetching, setDataLoading]);

  return query;
};

// Hook for mutations with loading states
export const useDataMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: () => void;
  }
) => {
  const { setDataLoading } = useLoading();
  
  const mutation = useMutation({
    mutationFn,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    onSettled: options?.onSettled,
  });

  // Update global loading state
  useEffect(() => {
    setDataLoading(mutation.isPending);
  }, [mutation.isPending, setDataLoading]);

  return mutation;
};
