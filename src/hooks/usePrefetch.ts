'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

interface PrefetchRule {
  currentPath: string;
  prefetchPaths: string[];
  queryKeys: string[][];
  queryFns: (() => Promise<any>)[];
  priority: 'high' | 'medium' | 'low';
  delay?: number; // ms delay before prefetching
}

const PREFETCH_RULES: PrefetchRule[] = [
  // Admin Dashboard Navigation
  {
    currentPath: '/admin',
    prefetchPaths: ['/admin/list/students', '/admin/list/teachers', '/admin/attendance'],
    queryKeys: [
      ['students', 'page=1&limit=20'],
      ['teachers', 'page=1&limit=20'],
      ['attendance', 'today']
    ],
    queryFns: [
      () => fetch('/api/students/optimized?page=1&limit=20').then(res => res.json()),
      () => fetch('/api/teachers/optimized?page=1&limit=20').then(res => res.json()),
      () => fetch('/api/attendance/today').then(res => res.json())
    ],
    priority: 'high',
    delay: 1000
  },
  
  // Student List to Student Detail
  {
    currentPath: '/admin/list/students',
    prefetchPaths: [],
    queryKeys: [
      ['students', 'page=2'],
      ['classes', 'all'],
      ['branches', 'all']
    ],
    queryFns: [
      () => fetch('/api/students/optimized?page=2').then(res => res.json()),
      () => fetch('/api/classes').then(res => res.json()),
      () => fetch('/api/branches').then(res => res.json())
    ],
    priority: 'medium',
    delay: 2000
  },

  // Teacher Dashboard
  {
    currentPath: '/teacher',
    prefetchPaths: ['/teacher/attendance', '/teacher/gradebook', '/teacher/homework'],
    queryKeys: [
      ['teacher-classes'],
      ['today-schedule'],
      ['pending-homework']
    ],
    queryFns: [
      () => fetch('/api/teacher/classes').then(res => res.json()),
      () => fetch('/api/teacher/schedule/today').then(res => res.json()),
      () => fetch('/api/teacher/homework/pending').then(res => res.json())
    ],
    priority: 'high',
    delay: 500
  },

  // Student Dashboard
  {
    currentPath: '/student',
    prefetchPaths: ['/student/homework', '/student/gradebook', '/student/attendance'],
    queryKeys: [
      ['student-homework', 'pending'],
      ['student-grades', 'statistics'],
      ['student-attendance', 'current-month']
    ],
    queryFns: [
      () => fetch('/api/student-homework?status=pending').then(res => res.json()),
      () => fetch('/api/student-grades?view=statistics').then(res => res.json()),
      () => fetch('/api/student-attendance?month=' + new Date().toISOString().slice(0, 7)).then(res => res.json())
    ],
    priority: 'high',
    delay: 800
  },

  // Parent Dashboard
  {
    currentPath: '/parent',
    prefetchPaths: ['/parent/children', '/parent/attendance', '/parent/grades'],
    queryKeys: [
      ['parent-children'],
      ['children-attendance', 'week'],
      ['children-grades', 'current']
    ],
    queryFns: [
      () => fetch('/api/parent/children').then(res => res.json()),
      () => fetch('/api/parent/attendance/week').then(res => res.json()),
      () => fetch('/api/parent/grades/current').then(res => res.json())
    ],
    priority: 'high',
    delay: 600
  },

  // Attendance to Gradebook (common teacher flow)
  {
    currentPath: '/teacher/attendance',
    prefetchPaths: ['/teacher/gradebook'],
    queryKeys: [
      ['gradebook', 'current-class'],
      ['subjects', 'teacher']
    ],
    queryFns: [
      () => fetch('/api/teacher/gradebook/current').then(res => res.json()),
      () => fetch('/api/teacher/subjects').then(res => res.json())
    ],
    priority: 'medium',
    delay: 3000
  },

  // HR Dashboard
  {
    currentPath: '/hr',
    prefetchPaths: ['/hr/employees', '/hr/attendance', '/hr/payroll'],
    queryKeys: [
      ['employees', 'active'],
      ['hr-attendance', 'today'],
      ['payroll', 'current-month']
    ],
    queryFns: [
      () => fetch('/api/hr/employees?status=active').then(res => res.json()),
      () => fetch('/api/hr/attendance/today').then(res => res.json()),
      () => fetch('/api/hr/payroll/current').then(res => res.json())
    ],
    priority: 'high',
    delay: 1200
  }
];

export const usePrefetch = () => {
  const pathname = usePathname();
  
  // Always call useQueryClient - let it handle its own errors
  const queryClient = useQueryClient();

  const prefetchForPath = useCallback(async (path: string) => {
    // Check if queryClient is available before using it
    if (!queryClient) {
      console.warn('QueryClient not available, skipping prefetch');
      return;
    }

    const rules = PREFETCH_RULES.filter(rule => 
      path.startsWith(rule.currentPath) || rule.currentPath === path
    );

    for (const rule of rules) {
      // Sort by priority
      const delay = rule.delay || 0;
      
      setTimeout(async () => {
        try {
          // Prefetch queries in parallel
          const prefetchPromises = rule.queryKeys.map((queryKey, index) => {
            const queryFn = rule.queryFns[index];
            if (queryFn && typeof queryFn === 'function') {
              return queryClient.prefetchQuery({
                queryKey,
                queryFn,
                staleTime: 5 * 60 * 1000, // 5 min stale time
              });
            }
            return Promise.resolve();
          });

          await Promise.allSettled(prefetchPromises);
          
          console.log(`✅ Prefetched data for ${path}:`, rule.queryKeys);
        } catch (error) {
          console.warn(`⚠️ Prefetch failed for ${path}:`, error);
        }
      }, delay);
    }
  }, [queryClient]);

  // Prefetch on pathname change
  useEffect(() => {
    prefetchForPath(pathname);
  }, [pathname, prefetchForPath]);

  // Manual prefetch function
  const prefetchPath = useCallback((path: string) => {
    prefetchForPath(path);
  }, [prefetchForPath]);

  return { prefetchPath };
};

// Hook for hover-based prefetching
export const useHoverPrefetch = () => {
  const { prefetchPath } = usePrefetch();

  const prefetchOnHover = useCallback((path: string) => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = () => {
      // Delay prefetch to avoid unnecessary requests on quick hovers
      timeoutId = setTimeout(() => {
        prefetchPath(path);
      }, 300);
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    return {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    };
  }, [prefetchPath]);

  return { prefetchOnHover };
};

// Hook for intersection-based prefetching (when elements come into view)
export const useIntersectionPrefetch = () => {
  const { prefetchPath } = usePrefetch();

  const prefetchOnIntersection = useCallback((path: string, threshold = 0.1) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchPath(path);
            observer.disconnect(); // Only prefetch once
          }
        });
      },
      { threshold }
    );

    return observer;
  }, [prefetchPath]);

  return { prefetchOnIntersection };
};

// Smart prefetch based on user behavior patterns
export const useSmartPrefetch = () => {
  const { prefetchPath } = usePrefetch();
  const pathname = usePathname();

  useEffect(() => {
    // Track user navigation patterns
    const navigationHistory = JSON.parse(
      localStorage.getItem('navigationHistory') || '[]'
    );

    // Add current path to history
    const updatedHistory = [pathname, ...navigationHistory.slice(0, 9)]; // Keep last 10
    localStorage.setItem('navigationHistory', JSON.stringify(updatedHistory));

    // Analyze patterns and prefetch likely next destinations
    const pathCounts: Record<string, number> = {};
    
    for (let i = 0; i < updatedHistory.length - 1; i++) {
      const current = updatedHistory[i];
      const next = updatedHistory[i + 1];
      
      if (current === pathname) {
        pathCounts[next] = (pathCounts[next] || 0) + 1;
      }
    }

    // Prefetch the most likely next paths
    const sortedPaths = Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3); // Top 3 most likely paths

    sortedPaths.forEach(([path, count], index) => {
      if (count >= 2) { // Only prefetch if visited at least twice from current path
        setTimeout(() => {
          prefetchPath(path);
        }, (index + 1) * 2000); // Stagger prefetching
      }
    });
  }, [pathname, prefetchPath]);

  return {};
};
