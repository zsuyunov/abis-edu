"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// Optimized query hook with caching and prefetching
export const useOptimizedQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number;
    select?: (data: T) => any;
  }
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchInterval: options?.refetchInterval,
    select: options?.select,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Optimized mutation hook with optimistic updates
export const useOptimizedMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: () => void;
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updater: (oldData: any, variables: TVariables) => any;
    };
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      if (options?.optimisticUpdate) {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: options.optimisticUpdate.queryKey });
        
        // Snapshot previous value
        const previousData = queryClient.getQueryData(options.optimisticUpdate.queryKey);
        
        // Optimistically update
        queryClient.setQueryData(
          options.optimisticUpdate.queryKey,
          (oldData: any) => options.optimisticUpdate!.updater(oldData, variables)
        );
        
        return { previousData };
      }
    },
    onError: (error, variables, context: any) => {
      // Rollback optimistic update on error
      if (options?.optimisticUpdate && context?.previousData) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }
      options?.onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data, variables);
    },
    onSettled: options?.onSettled,
  });
};

// Hook for prefetching data
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(
    <T>(
      queryKey: string[],
      queryFn: () => Promise<T>,
      staleTime = 5 * 60 * 1000
    ) => {
      return queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      });
    },
    [queryClient]
  );

  return { prefetchQuery };
};

// Hook for managing cache
export const useCache = () => {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(
    (queryKey: string[]) => {
      return queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  const removeQueries = useCallback(
    (queryKey: string[]) => {
      return queryClient.removeQueries({ queryKey });
    },
    [queryClient]
  );

  const setQueryData = useCallback(
    (queryKey: string[], data: any) => {
      return queryClient.setQueryData(queryKey, data);
    },
    [queryClient]
  );

  const getQueryData = useCallback(
    (queryKey: string[]) => {
      return queryClient.getQueryData(queryKey);
    },
    [queryClient]
  );

  return {
    invalidateQueries,
    removeQueries,
    setQueryData,
    getQueryData,
  };
};

// Memoized data selector hook
export const useMemoizedSelector = <T, R>(
  data: T | undefined,
  selector: (data: T) => R,
  deps: any[] = []
) => {
  return useMemo(() => {
    if (!data) return undefined;
    return selector(data);
  }, [data, ...deps]);
};
