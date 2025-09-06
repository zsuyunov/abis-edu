"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

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
            // OPTIMIZED CACHING - Fast but balanced
            staleTime: 5 * 60 * 1000, // 5 minutes - fresh data
            gcTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
            retry: 1, // Single retry for reliability
            refetchOnWindowFocus: false, // Don't refetch on focus
            refetchOnReconnect: true, // Refetch on reconnect for fresh data
            refetchOnMount: true, // Refetch on mount for latest data
            refetchInterval: false, // No automatic refetching
            refetchIntervalInBackground: false,
            suspense: false,
            networkMode: 'online', // Use network first for fresh data
            // PERFORMANCE OPTIMIZATIONS
            placeholderData: (previousData) => previousData, // Keep previous data while loading
            structuralSharing: true, // Enable for better performance
            notifyOnChangeProps: ['data', 'error'], // Notify on data and error changes
            // DATA ACCESS
            initialData: undefined, // Start with no data
            keepPreviousData: true, // Keep previous data while loading
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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}