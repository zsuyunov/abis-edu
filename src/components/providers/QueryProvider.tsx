"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { CacheManager } from '@/lib/cacheUtils';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // FRESH DATA CACHING - Always get latest data
            staleTime: 0, // Always consider data stale - fetch fresh data
            gcTime: 5 * 60 * 1000, // 5 minutes - keep in memory for performance
            retry: 1, // Single retry for reliability
            refetchOnWindowFocus: true, // Refetch on focus for fresh data
            refetchOnReconnect: true, // Refetch on reconnect for fresh data
            refetchOnMount: true, // Refetch on mount for latest data
            refetchInterval: false, // No automatic refetching
            refetchIntervalInBackground: false,
            networkMode: 'online', // Use network first for fresh data
            // PERFORMANCE OPTIMIZATIONS
            placeholderData: (previousData: any) => previousData, // Keep previous data while loading
            structuralSharing: true, // Enable for better performance
            notifyOnChangeProps: ['data', 'error'], // Notify on data and error changes
            // DATA ACCESS
            initialData: undefined, // Start with no data
          },
          mutations: {
            retry: 0, // No retries - instant feedback
            networkMode: 'always',
            // Optimistic updates for instant UI
            onMutate: async (variables) => {
              // Return optimistic data immediately
              return { optimisticData: variables };
            },
          },
        },
      }),
  );

  // Set the query client for cache management
  useEffect(() => {
    CacheManager.setQueryClient(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}