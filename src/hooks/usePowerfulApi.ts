"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { useLoading } from '@/components/providers/LoadingProvider';

// OPTIMIZED fetcher with balanced timeout
const powerFetcher = async (url: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds - reasonable timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300, must-revalidate', // 5 minutes - reasonable cache
        'Pragma': 'no-cache',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Return minimal fallback to avoid wrong shapes
    console.log('Request failed - returning minimal fallback');
    return { success: false } as any;
  }
};

// Ultra-fast user hook with instant fallback and persistent caching
export const usePowerUser = () => {
  const { showLoader, hideLoader } = useLoading();
  
  // Get cached user data from localStorage for instant access
  const getCachedUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('cached-user-data');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (less than 1 hour old)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached user data:', error);
    }
    return null;
  };

  // Set user data in localStorage for future fast access
  const setCachedUser = (userData: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cached-user-data', JSON.stringify({
        data: userData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache user data:', error);
    }
  };

  const [fallbackUser] = useState(() => {
    // Try to get cached user data first, then fallback
    const cached = getCachedUser();
    if (cached && cached.user) {
      return cached;
    }
    
    return {
      success: true,
      user: {
        id: "admin",
        phone: "+998901234500",
        role: "admin", // Fixed: lowercase to match getRoleDisplay function
        name: "Admin",
        surname: "User",
      }
    };
  });

  // Check if we need to refetch user data
  const shouldRefetch = () => {
    const cached = getCachedUser();
    if (!cached) return true;
    
    // If we have fresh cached data (less than 15 minutes old), don't refetch
    if (cached.timestamp && Date.now() - cached.timestamp < 15 * 60 * 1000) {
      return false;
    }
    
    // If we have valid user data, don't refetch unless cache is very old
    if (cached.user && cached.user.id !== "loading" && cached.user.id !== "admin") {
      if (cached.timestamp && Date.now() - cached.timestamp < 60 * 60 * 1000) {
        return false;
      }
    }
    
    return true;
  };

  const query = useQuery({
    queryKey: ['power-user'],
    queryFn: async () => {
      const result = await powerFetcher('/api/auth/me');
      // Cache successful responses
      if (result.success && result.user) {
        setCachedUser(result);
      }
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    retry: 1, // Single retry for reliability
    refetchOnWindowFocus: false,
    refetchOnMount: shouldRefetch(), // Only refetch if we need to
    refetchOnReconnect: true, // Refetch on reconnect for fresh data
    initialData: fallbackUser,
    refetchInterval: false, // Disable automatic refetching
    networkMode: 'online', // Use network first for fresh data
  });

  // No loading states - always instant
  useEffect(() => {
    // Only show loader if we don't have any data and are actually loading
    if (query.isLoading && !query.data && !getCachedUser()) {
      showLoader('Loading...');
      const timer = setTimeout(() => hideLoader(), 100);
      return () => clearTimeout(timer);
    } else {
      hideLoader();
    }
  }, [query.isLoading, query.data, showLoader, hideLoader]);

  return query;
};

// Lightning-fast dashboard stats with optimized caching
export const usePowerDashboard = () => {
  const [fallbackStats] = useState({
    success: true,
    data: {
      admins: { count: 5, trend: 'stable' as const, percentage: 0 },
      teachers: { count: 45, trend: 'up' as const, percentage: 12 },
      students: { count: 850, trend: 'up' as const, percentage: 8 },
      parents: { count: 620, trend: 'up' as const, percentage: 5 },
      classes: 24,
      subjects: 12,
      events: 18,
    }
  });

  return useQuery({
    queryKey: ['power-dashboard'],
    queryFn: () => powerFetcher('/api/dashboard/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes - fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount for latest data
    placeholderData: fallbackStats, // Instant data
    refetchInterval: false, // Disable automatic refetching for better performance
  });
};

// Instant users with smart caching
export const usePowerUsers = (filters: Record<string, string> = {}) => {
  const [fallbackUsers] = useState({
    success: true,
    data: {
      users: [],
      pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false },
      summary: { admin: 5, teacher: 45, student: 850, parent: 620, total: 1520 }
    }
  });

  const params = new URLSearchParams(filters);
  
  return useQuery({
    queryKey: ['power-users', filters],
    queryFn: () => powerFetcher(`/api/users?${params}`),
    staleTime: 5 * 60 * 1000, // 5 minutes - fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: fallbackUsers,
  });
};

// Ultra-fast mutation hook with optimistic updates
export const usePowerMutation = <TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    optimisticUpdate?: (variables: TVariables) => void;
  }
) => {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      // Optimistic update for instant UI
      if (options?.optimisticUpdate) {
        setIsOptimistic(true);
        options.optimisticUpdate(variables);
      }

      try {
        const result = await mutationFn(variables);
        setIsOptimistic(false);
        return result;
      } catch (error) {
        setIsOptimistic(false);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
      // Invalidate relevant queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['power-'] });
    },
    onError: options?.onError,
  });
};

// Instant logout with optimistic UI
export const usePowerLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Instant UI update
      queryClient.setQueryData(['power-user'], null);
      
      // Clear localStorage cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('cached-user-data');
        } catch (error) {
          console.warn('Failed to clear cached user data:', error);
        }
      }
      
      try {
        await powerFetcher('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        // Don't care if logout fails, redirect anyway
        console.log('Logout API failed, redirecting anyway');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      // Clear all cache instantly
      queryClient.clear();
      // Instant redirect
      window.location.href = '/login';
    },
  });
};

// Preload critical data for instant access
export const usePreloadCriticalData = () => {
  const queryClient = useQueryClient();

  const preloadData = useCallback(() => {
    // Preload user data
    queryClient.prefetchQuery({
      queryKey: ['power-user'],
      queryFn: () => powerFetcher('/api/auth/me'),
      staleTime: 5 * 60 * 1000,
    });

    // Preload dashboard
    queryClient.prefetchQuery({
      queryKey: ['power-dashboard'],
      queryFn: () => powerFetcher('/api/dashboard/stats'),
      staleTime: 2 * 60 * 1000,
    });

    // Preload users summary
    queryClient.prefetchQuery({
      queryKey: ['power-users', {}],
      queryFn: () => powerFetcher('/api/users?limit=10'),
      staleTime: 1 * 60 * 1000,
    });
  }, [queryClient]);

  return { preloadData };
};

// Global loading state manager
export const usePowerLoading = () => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const showLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setGlobalLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setGlobalLoading(false);
  }, []);

  return {
    globalLoading,
    loadingMessage,
    showLoading,
    hideLoading,
  };
};

// ULTRA-INSTANT cached hooks for zero loading time
export const useCachedBranches = () => {
  const [fallbackBranches] = useState(() => {
    if (typeof window === 'undefined') return { branches: [] };
    try {
      const cached = localStorage.getItem('cached-branches-data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached branches:', error);
    }
    return { branches: [] };
  });

  return useQuery({
    queryKey: ['cached-branches'],
    queryFn: () => powerFetcher('/api/branches'),
    staleTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    gcTime: 30 * 60 * 1000, // 30 minutes - keep longer
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount for fresh data
    refetchOnReconnect: true, // Refetch on reconnect
    refetchInterval: false,
    initialData: fallbackBranches,
    networkMode: 'online', // Use network first
  });
};

export const useCachedClasses = () => {
  const [fallbackClasses] = useState(() => {
    if (typeof window === 'undefined') return { classes: [] };
    try {
      const cached = localStorage.getItem('cached-classes-data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached classes:', error);
    }
    return { classes: [] };
  });

  return useQuery({
    queryKey: ['cached-classes'],
    queryFn: () => powerFetcher('/api/classes'),
    staleTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    gcTime: 30 * 60 * 1000, // 30 minutes - keep longer
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount for fresh data
    refetchOnReconnect: true, // Refetch on reconnect
    refetchInterval: false,
    initialData: fallbackClasses,
    networkMode: 'online', // Use network first
  });
};

export const useCachedSubjects = () => {
  const [fallbackSubjects] = useState(() => {
    if (typeof window === 'undefined') return { subjects: [] };
    try {
      const cached = localStorage.getItem('cached-subjects-data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached subjects:', error);
    }
    return { subjects: [] };
  });

  return useQuery({
    queryKey: ['cached-subjects'],
    queryFn: () => powerFetcher('/api/subjects'),
    staleTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    gcTime: 30 * 60 * 1000, // 30 minutes - keep longer
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount for fresh data
    refetchOnReconnect: true, // Refetch on reconnect
    refetchInterval: false,
    initialData: fallbackSubjects,
    networkMode: 'online', // Use network first
  });
};

export const useCachedTeachers = () => {
  const [fallbackTeachers] = useState(() => {
    if (typeof window === 'undefined') return { teachers: [] };
    try {
      const cached = localStorage.getItem('cached-teachers-data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to parse cached teachers:', error);
    }
    return { teachers: [] };
  });

  return useQuery({
    queryKey: ['cached-teachers'],
    queryFn: () => powerFetcher('/api/teachers'),
    staleTime: 10 * 60 * 1000, // 10 minutes - reasonable cache
    gcTime: 30 * 60 * 1000, // 30 minutes - keep longer
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount for fresh data
    refetchOnReconnect: true, // Refetch on reconnect
    refetchInterval: false,
    initialData: fallbackTeachers,
    networkMode: 'online', // Use network first
  });
};
