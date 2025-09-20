"use client";

import { QueryClient } from '@tanstack/react-query';

// Cache invalidation utilities for ensuring fresh data
export class CacheManager {
  private static queryClient: QueryClient | null = null;

  static setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  // Invalidate all data-related queries
  static invalidateAllData() {
    if (!this.queryClient) return;

    // Invalidate all queries that might contain stale data
    this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && (
          queryKey.some(key => 
            typeof key === 'string' && (
              key.includes('branches') ||
              key.includes('classes') ||
              key.includes('subjects') ||
              key.includes('academic-years') ||
              key.includes('teachers') ||
              key.includes('students') ||
              key.includes('parents') ||
              key.includes('timetables') ||
              key.includes('assignments')
            )
          )
        );
      }
    });
  }

  // Invalidate specific data type
  static invalidateData(type: 'branches' | 'classes' | 'subjects' | 'academic-years' | 'teachers' | 'students' | 'parents' | 'timetables' | 'assignments') {
    if (!this.queryClient) return;

    this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && 
          queryKey.some(key => typeof key === 'string' && key.includes(type));
      }
    });
  }

  // Clear all caches and force fresh data
  static clearAllCaches() {
    if (!this.queryClient) return;

    // Clear all queries
    this.queryClient.clear();
    
    // Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Clear localStorage caches
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('cached-') ||
        key.includes('query-') ||
        key.includes('tanstack')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Force refresh all data
  static async forceRefreshAll() {
    this.clearAllCaches();
    
    // Reload the page to ensure fresh data
    window.location.reload();
  }
}

// Hook for cache management
export function useCacheManager() {
  const invalidateAll = () => CacheManager.invalidateAllData();
  const invalidate = (type: Parameters<typeof CacheManager.invalidateData>[0]) => CacheManager.invalidateData(type);
  const clearAll = () => CacheManager.clearAllCaches();
  const forceRefresh = () => CacheManager.forceRefreshAll();

  return {
    invalidateAll,
    invalidate,
    clearAll,
    forceRefresh
  };
}
