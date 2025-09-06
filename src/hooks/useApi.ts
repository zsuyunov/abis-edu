"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fast API fetcher with timeout
const fetcher = async (url: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
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
    throw error;
  }
};

// Hook for user data (cached)
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => fetcher('/api/auth/me'),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for users list (cached with filters)
export const useUsers = (filters: Record<string, string> = {}) => {
  const params = new URLSearchParams(filters);
  
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => fetcher(`/api/users?${params}`),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for dashboard stats (cached)
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetcher('/api/dashboard/stats'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for branches (cached for long time)
export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => fetcher('/api/branches'),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (branches don't change often)
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for subjects (cached for long time)
export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => fetcher('/api/subjects'),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for academic years (cached for long time)
export const useAcademicYears = () => {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: () => fetcher('/api/academic-years'),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for classes (cached with branch/year filters)
export const useClasses = (branchId?: string, academicYearId?: string) => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);
  if (academicYearId) params.append('academicYearId', academicYearId);
  
  return useQuery({
    queryKey: ['classes', branchId, academicYearId],
    queryFn: () => fetcher(`/api/classes?${params}`),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache for 20 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!branchId, // Only run if branchId is provided
  });
};

// Hook for grades (cached with filters)
export const useGrades = (filters: Record<string, string> = {}) => {
  const params = new URLSearchParams(filters);
  
  return useQuery({
    queryKey: ['grades', filters],
    queryFn: () => fetcher(`/api/grades?${params}`),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for attendance (cached with filters)
export const useAttendance = (filters: Record<string, string> = {}) => {
  const params = new URLSearchParams(filters);
  
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => fetcher(`/api/attendance?${params}`),
    staleTime: 1 * 60 * 1000, // Cache for 1 minute (attendance changes frequently)
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => fetcher('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      window.location.href = '/login';
    },
    onError: () => {
      // Force redirect even if logout fails
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};
