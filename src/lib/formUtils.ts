"use client";

import { useCacheManager } from './cacheUtils';

// Utility hook for form operations with automatic cache invalidation
export function useFormWithCache() {
  const { invalidate, invalidateAll } = useCacheManager();

  // Invalidate caches after successful operations
  const handleSuccess = (operation: string, dataType?: string) => {
    if (dataType) {
      invalidate(dataType as any);
    } else {
      // If no specific data type, invalidate all data
      invalidateAll();
    }
  };

  return {
    handleSuccess,
    invalidate,
    invalidateAll
  };
}

// Common data types for cache invalidation
export const DATA_TYPES = {
  BRANCHES: 'branches',
  CLASSES: 'classes',
  SUBJECTS: 'subjects',
  ACADEMIC_YEARS: 'academic-years',
  TEACHERS: 'teachers',
  STUDENTS: 'students',
  PARENTS: 'parents',
  TIMETABLES: 'timetables',
  ASSIGNMENTS: 'assignments'
} as const;
