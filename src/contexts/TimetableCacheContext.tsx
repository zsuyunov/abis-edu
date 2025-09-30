"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface TimetableData {
  [key: string]: any[]; // Cache key -> timetable data
}

interface TimetableCacheContextType {
  getCachedData: (key: string) => any[] | null;
  setCachedData: (key: string, data: any[]) => void;
  clearCache: () => void;
  isDataCached: (key: string) => boolean;
  preloadWeek: (teacherId: string, branchId: string, role: string) => Promise<void>;
  invalidateCache: (pattern?: string) => void;
}

const TimetableCacheContext = createContext<TimetableCacheContextType | undefined>(undefined);

export const useTimetableCache = () => {
  const context = useContext(TimetableCacheContext);
  if (!context) {
    throw new Error('useTimetableCache must be used within a TimetableCacheProvider');
  }
  return context;
};

interface TimetableCacheProviderProps {
  children: ReactNode;
}

export const TimetableCacheProvider: React.FC<TimetableCacheProviderProps> = ({ children }) => {
  const [cache, setCache] = useState<TimetableData>({});

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem('timetable-cache');
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        setCache(parsedCache);
        console.log('🚀 Loaded timetable cache from localStorage:', Object.keys(parsedCache).length, 'entries');
      }
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
    }
  }, []);

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('timetable-cache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }, [cache]);

  const getCachedData = useCallback((key: string) => {
    return cache[key] || null;
  }, [cache]);

  const setCachedData = useCallback((key: string, data: any[]) => {
    setCache(prev => ({
      ...prev,
      [key]: data
    }));
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
    localStorage.removeItem('timetable-cache');
  }, []);

  const isDataCached = useCallback((key: string) => {
    return key in cache && cache[key] && cache[key].length > 0;
  }, [cache]);

  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      // Invalidate specific pattern (e.g., all entries for a teacher)
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          if (key.includes(pattern)) {
            delete newCache[key];
          }
        });
        return newCache;
      });
      console.log('🗑️ Invalidated cache entries matching pattern:', pattern);
    } else {
      // Clear all cache
      setCache({});
      localStorage.removeItem('timetable-cache');
      console.log('🗑️ Cleared all cache');
    }
  }, []);

  const preloadWeek = useCallback(async (teacherId: string, branchId: string, role: string) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
      }

      console.log('⚡ INSTANT preloading entire week:', weekDates);

      // Preload all days in parallel for maximum speed
      const preloadPromises = weekDates.map(async (date) => {
        const cacheKey = `${teacherId}-${date}-${branchId}-${role}`;
        
        // Skip if already cached
        if (isDataCached(cacheKey)) {
          console.log('🚀 Already cached:', cacheKey);
          return;
        }

        try {
          // Calculate weekly date range for recurring timetables
          const today = new Date(date);
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
          
          const startDate = startOfWeek.toISOString().split('T')[0];
          const endDate = endOfWeek.toISOString().split('T')[0];
          
          const response = await fetch(
            `/api/teacher-timetables?teacherId=${teacherId}&startDate=${startDate}&endDate=${endDate}&branchId=${branchId}&mode=${role.toLowerCase()}`,
            { 
              headers: { 'x-user-id': teacherId },
              cache: 'force-cache' // Aggressive caching
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const rawTimetables = Array.isArray(data.timetables) ? data.timetables : [];
            
            // Process and filter data
            const selectedDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            const filteredTimetables = rawTimetables.filter((timetable: any) => {
              if (timetable.dayOfWeek) {
                return timetable.dayOfWeek?.toUpperCase() === selectedDay;
              }
              if (timetable.date) {
                const timetableDate = new Date(timetable.date).toISOString().split('T')[0];
                return timetableDate === date;
              }
              return true;
            });

            const processedTimetables = filteredTimetables.map((timetable: any) => {
              const subject = timetable.subject || (timetable.subjects && timetable.subjects.length > 0 ? timetable.subjects[0] : null);
              
              return {
                id: timetable.id,
                fullDate: date,
                startTime: timetable.startTime || "00:00",
                endTime: timetable.endTime || "00:00",
                lessonNumber: timetable.lessonNumber || 1,
                classroom: timetable.roomNumber || timetable.buildingName || "Classroom",
                class: {
                  id: timetable.class?.id || 'unknown',
                  name: timetable.class?.name || 'Unknown Class',
                  academicYear: timetable.class?.academicYear || timetable.academicYear || { id: 1, name: "Default" }
                },
                subject: {
                  id: subject?.id || 'unknown',
                  name: subject?.name || 'Unknown Subject'
                },
                branch: {
                  id: timetable.branch?.id || 'unknown',
                  shortName: timetable.branch?.shortName || 'Unknown Branch'
                },
                topics: timetable.topics || [],
                homework: timetable.homework || []
              };
            });

            // ALWAYS cache the result, even if empty array
            setCachedData(cacheKey, processedTimetables);
            console.log('⚡ Preloaded:', cacheKey, 'Count:', processedTimetables.length);
          }
        } catch (error) {
          console.error('Error preloading:', date, error);
          // Cache empty result to prevent repeated failed requests
          setCachedData(cacheKey, []);
        }
      });

      await Promise.all(preloadPromises);
      console.log('🎉 Week preloading completed!');
    } catch (error) {
      console.error('Error in preloadWeek:', error);
    }
  }, [isDataCached, setCachedData]);

  const value: TimetableCacheContextType = {
    getCachedData,
    setCachedData,
    clearCache,
    isDataCached,
    preloadWeek,
    invalidateCache,
  };

  return (
    <TimetableCacheContext.Provider value={value}>
      {children}
    </TimetableCacheContext.Provider>
  );
};
