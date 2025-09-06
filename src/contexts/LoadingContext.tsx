'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface LoadingContextType {
  isNavigating: boolean;
  isDataLoading: boolean;
  setDataLoading: (loading: boolean) => void;
  navigationProgress: number;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Create a stable QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const pathname = usePathname();

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

      // Safety timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        setIsNavigating(false);
        setNavigationProgress(100);
      }, 10000);
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

  // Listen to pathname changes for navigation detection
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 500); // Minimum loading time for UX

    return () => clearTimeout(timer);
  }, [pathname]);

  const setDataLoading = (loading: boolean) => {
    setIsDataLoading(loading);
  };

  const contextValue: LoadingContextType = {
    isNavigating,
    isDataLoading,
    setDataLoading,
    navigationProgress,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LoadingContext.Provider value={contextValue}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </LoadingContext.Provider>
    </QueryClientProvider>
  );
};

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

// Utility to invalidate queries
export const invalidateQueries = (queryKey: string[]) => {
  return queryClient.invalidateQueries({ queryKey });
};

// Utility to prefetch data
export const prefetchQuery = <T,>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  staleTime = 5 * 60 * 1000
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
};
