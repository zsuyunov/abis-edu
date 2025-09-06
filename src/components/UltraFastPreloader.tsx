"use client";

import { useEffect, useState } from 'react';
import { useCachedBranches, useCachedClasses, useCachedSubjects, useCachedTeachers } from '@/hooks/usePowerfulApi';

// ULTRA-INSTANT preloader for zero loading time
export const UltraFastPreloader = () => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  
  // Preload all critical data hooks
  const branchesQuery = useCachedBranches();
  const classesQuery = useCachedClasses();
  const subjectsQuery = useCachedSubjects();
  const teachersQuery = useCachedTeachers();

  useEffect(() => {
    // Check if all critical data is loaded
    const allDataLoaded = 
      branchesQuery.data && 
      classesQuery.data && 
      subjectsQuery.data && 
      teachersQuery.data;

    if (allDataLoaded) {
      setIsPreloaded(true);
    }
  }, [branchesQuery.data, classesQuery.data, subjectsQuery.data, teachersQuery.data]);

  // Preload additional data in background
  useEffect(() => {
    const preloadAdditionalData = async () => {
      try {
        // Preload academic years
        const academicYearsRes = await fetch('/api/academic-years', {
          headers: { 'Cache-Control': 'max-age=3600, immutable' }
        });
        if (academicYearsRes.ok) {
          const academicYearsData = await academicYearsRes.json();
          localStorage.setItem('cached-academic-years-data', JSON.stringify({
            data: academicYearsData,
            timestamp: Date.now()
          }));
        }

        // Preload students list
        const studentsRes = await fetch('/api/students?limit=50', {
          headers: { 'Cache-Control': 'max-age=1800, immutable' }
        });
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          localStorage.setItem('cached-students-data', JSON.stringify({
            data: studentsData,
            timestamp: Date.now()
          }));
        }

        // Preload parents list
        const parentsRes = await fetch('/api/parents?limit=50', {
          headers: { 'Cache-Control': 'max-age=1800, immutable' }
        });
        if (parentsRes.ok) {
          const parentsData = await parentsRes.json();
          localStorage.setItem('cached-parents-data', JSON.stringify({
            data: parentsData,
            timestamp: Date.now()
          }));
        }

      } catch (error) {
        // Silent fail - don't block the app
        console.log('Additional data preload failed:', error);
      }
    };

    // Start preloading after critical data is loaded
    if (isPreloaded) {
      preloadAdditionalData();
    }
  }, [isPreloaded]);

  // Show nothing - this is a background component
  return null;
};
