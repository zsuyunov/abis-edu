'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDataQuery } from '@/components/providers/LoadingProvider';
import { useDebounce } from './useDebounce';

interface ScopedDataOptions {
  baseUrl: string;
  defaultFilters?: Record<string, any>;
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  pageSize?: number;
  searchFields?: string[];
  cacheTime?: number;
  staleTime?: number;
}

interface FilterState {
  search: string;
  filters: Record<string, any>;
  sort: { field: string; direction: 'asc' | 'desc' };
  page: number;
  pageSize: number;
}

export const useScopedData = <T>(options: ScopedDataOptions) => {
  const {
    baseUrl,
    defaultFilters = {},
    defaultSort = { field: 'createdAt', direction: 'desc' },
    pageSize = 20,
    searchFields = ['name'],
    cacheTime = 10 * 60 * 1000, // 10 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
  } = options;

  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    filters: defaultFilters,
    sort: defaultSort,
    page: 1,
    pageSize,
  });

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(filterState.search, 300);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    
    // Add pagination
    params.set('page', filterState.page.toString());
    params.set('limit', filterState.pageSize.toString());
    
    // Add search
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
      params.set('searchFields', searchFields.join(','));
    }
    
    // Add filters
    Object.entries(filterState.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    // Add sorting
    params.set('sortBy', filterState.sort.field);
    params.set('sortOrder', filterState.sort.direction);
    
    return params.toString();
  }, [filterState, debouncedSearch, searchFields]);

  // Generate cache key
  const cacheKey = useMemo(() => [
    baseUrl.replace('/api/', ''),
    queryParams
  ], [baseUrl, queryParams]);

  // Fetch data with scoped parameters
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useDataQuery<{
    data: T[];
    count: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>(
    cacheKey,
    async () => {
      const response = await fetch(`${baseUrl}?${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${baseUrl}`);
      }
      return response.json();
    },
    {
      staleTime,
      gcTime: cacheTime,
    }
  );

  // Update search
  const setSearch = useCallback((search: string) => {
    setFilterState(prev => ({
      ...prev,
      search,
      page: 1, // Reset to first page on search
    }));
  }, []);

  // Update filters
  const setFilters = useCallback((filters: Record<string, any>) => {
    setFilterState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1, // Reset to first page on filter change
    }));
  }, []);

  // Update single filter
  const setFilter = useCallback((key: string, value: any) => {
    setFilterState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1, // Reset to first page on filter change
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      filters: defaultFilters,
      search: '',
      page: 1,
    }));
  }, [defaultFilters]);

  // Update sorting
  const setSort = useCallback((field: string, direction?: 'asc' | 'desc') => {
    setFilterState(prev => ({
      ...prev,
      sort: {
        field,
        direction: direction || (prev.sort.field === field && prev.sort.direction === 'asc' ? 'desc' : 'asc'),
      },
      page: 1, // Reset to first page on sort change
    }));
  }, []);

  // Update page
  const setPage = useCallback((page: number) => {
    setFilterState(prev => ({ ...prev, page }));
  }, []);

  // Update page size
  const setPageSize = useCallback((pageSize: number) => {
    setFilterState(prev => ({
      ...prev,
      pageSize,
      page: 1, // Reset to first page on page size change
    }));
  }, []);

  // Navigation helpers
  const goToNextPage = useCallback(() => {
    if (data?.hasNext) {
      setPage(filterState.page + 1);
    }
  }, [data?.hasNext, filterState.page, setPage]);

  const goToPrevPage = useCallback(() => {
    if (data?.hasPrev) {
      setPage(filterState.page - 1);
    }
  }, [data?.hasPrev, filterState.page, setPage]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const goToLastPage = useCallback(() => {
    if (data?.totalPages) {
      setPage(data.totalPages);
    }
  }, [data?.totalPages, setPage]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch.trim()) count++;
    
    Object.entries(filterState.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && 
          JSON.stringify(value) !== JSON.stringify(defaultFilters[key])) {
        count++;
      }
    });
    
    return count;
  }, [filterState.filters, debouncedSearch, defaultFilters]);

  return {
    // Data
    data: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    hasNext: data?.hasNext || false,
    hasPrev: data?.hasPrev || false,
    
    // Loading states
    isLoading,
    isFetching,
    error,
    
    // Current state
    search: filterState.search,
    filters: filterState.filters,
    sort: filterState.sort,
    page: filterState.page,
    pageSize: filterState.pageSize,
    activeFilterCount,
    
    // Actions
    setSearch,
    setFilters,
    setFilter,
    clearFilters,
    setSort,
    setPage,
    setPageSize,
    refetch,
    
    // Navigation
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
  };
};

// Specialized hooks for common entities
export const useScopedStudents = (initialFilters?: Record<string, any>) => {
  return useScopedData<any>({
    baseUrl: '/api/students/optimized',
    defaultFilters: initialFilters || {},
    searchFields: ['firstName', 'lastName', 'studentId', 'phone'],
    pageSize: 25,
  });
};

export const useScopedTeachers = (initialFilters?: Record<string, any>) => {
  return useScopedData<any>({
    baseUrl: '/api/teachers/optimized',
    defaultFilters: initialFilters || {},
    searchFields: ['firstName', 'lastName', 'teacherId', 'email'],
    pageSize: 20,
  });
};

export const useScopedAttendance = (initialFilters?: Record<string, any>) => {
  return useScopedData<any>({
    baseUrl: '/api/attendance/optimized',
    defaultFilters: { date: new Date().toISOString().split('T')[0], ...initialFilters },
    searchFields: ['student.firstName', 'student.lastName'],
    pageSize: 50,
    staleTime: 30 * 1000, // 30 seconds for attendance (more real-time)
  });
};

export const useScopedGradebook = (initialFilters?: Record<string, any>) => {
  return useScopedData<any>({
    baseUrl: '/api/gradebook/optimized',
    defaultFilters: initialFilters || {},
    searchFields: ['student.firstName', 'student.lastName', 'subject.name'],
    pageSize: 30,
  });
};

export const useScopedHomework = (initialFilters?: Record<string, any>) => {
  return useScopedData<any>({
    baseUrl: '/api/homework/optimized',
    defaultFilters: initialFilters || {},
    searchFields: ['title', 'subject.name', 'class.name'],
    pageSize: 15,
  });
};

export const useScopedUsers = (initialFilters?: Record<string, any>) => {
  return useScopedData<any>({
    baseUrl: '/api/users/optimized',
    defaultFilters: initialFilters || {},
    searchFields: ['firstName', 'lastName', 'email', 'username'],
    pageSize: 20,
  });
};
