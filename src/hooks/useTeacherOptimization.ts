"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Cache for frequently accessed data
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Optimized data fetcher with aggressive caching
export const useTeacherData = (teacherId: string, options: {
  date?: string;
  branchId?: string;
  role?: string;
} = {}) => {
  const queryClient = useQueryClient();
  const cacheKey = `teacher-${teacherId}-${options.date}-${options.branchId}-${options.role}`;

  return useQuery({
    queryKey: ['teacher-data', teacherId, options],
    queryFn: async () => {
      // Check cache first
      const cached = dataCache.get(cacheKey) as CacheEntry;
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const params = new URLSearchParams();
      if (options.date) params.append('startDate', options.date);
      if (options.date) params.append('endDate', options.date);
      if (options.branchId) params.append('branchId', options.branchId);
      if (options.role) params.append('mode', options.role.toLowerCase());

      const response = await fetch(
        `/api/teacher-timetables?teacherId=${teacherId}&${params.toString()}`,
        {
          headers: { 'x-user-id': teacherId },
          // Add cache headers for browser caching
          cache: 'force-cache',
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      
      const data = await response.json();
      
      // Cache the result
      dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
};

// Preload next/previous day data
export const useDataPreloader = (teacherId: string, currentDate: string, branchId: string, role: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const preloadData = async () => {
      const currentDateObj = new Date(currentDate);
      
      // Preload next day
      const nextDay = new Date(currentDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];
      
      // Preload previous day
      const prevDay = new Date(currentDateObj);
      prevDay.setDate(prevDay.getDate() - 1);
      const prevDateStr = prevDay.toISOString().split('T')[0];

      // Prefetch both days
      [nextDateStr, prevDateStr].forEach(date => {
        queryClient.prefetchQuery({
          queryKey: ['teacher-data', teacherId, { date, branchId, role }],
          queryFn: async () => {
            const params = new URLSearchParams({
              startDate: date,
              endDate: date,
              branchId,
              mode: role.toLowerCase()
            });

            const response = await fetch(
              `/api/teacher-timetables?teacherId=${teacherId}&${params.toString()}`,
              { headers: { 'x-user-id': teacherId } }
            );

            if (!response.ok) throw new Error(`Failed to prefetch: ${response.status}`);
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        });
      });
    };

    const timer = setTimeout(preloadData, 500); // Small delay to avoid blocking UI
    return () => clearTimeout(timer);
  }, [teacherId, currentDate, branchId, role, queryClient]);
};

// Optimized mutation with instant UI updates
export const useOptimizedMutation = (
  mutationFn: (variables: any) => Promise<any>,
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    invalidateQueries?: string[][];
  } = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      if (options.invalidateQueries) {
        await Promise.all(
          options.invalidateQueries.map(queryKey =>
            queryClient.cancelQueries({ queryKey })
          )
        );
      }
    },
    onSuccess: (data, variables) => {
      // Clear relevant cache entries
      const keysToDelete = Array.from(dataCache.keys()).filter(key => 
        key.includes('teacher-') && key.includes(variables.teacherId || '')
      );
      keysToDelete.forEach(key => dataCache.delete(key));

      // Invalidate queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
  });

  useEffect(() => {
    const startTime = performance.now();
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          setMetrics(prev => ({
            ...prev,
            loadTime: entry.duration,
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'measure'] });

    return () => {
      observer.disconnect();
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime,
      }));
    };
  }, []);

  return metrics;
};

// Memory cleanup utility
export const useMemoryCleanup = () => {
  useEffect(() => {
    const cleanup = () => {
      // Clean old cache entries
      const now = Date.now();
      const entries = Array.from(dataCache.entries());
      entries.forEach(([key, entry]) => {
        if (now - entry.timestamp > CACHE_DURATION * 2) {
          dataCache.delete(key);
        }
      });
    };

    const interval = setInterval(cleanup, 60000); // Clean every minute
    return () => clearInterval(interval);
  }, []);
};

// Fast state management for UI
export const useFastState = <T>(initialValue: T) => {
  const [state, setState] = useState(initialValue);
  
  const fastSetState = useCallback((value: T | ((prev: T) => T)) => {
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  return [state, fastSetState] as const;
};
