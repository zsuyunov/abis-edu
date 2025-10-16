"use client";

import React, { useMemo } from "react";
import { 
  Clock, 
  MapPin, 
  BookOpen, 
  User,
  Building,
  AlertCircle,
  Calendar as CalendarIcon
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";

interface TimetableEntry {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  subjects: Array<{ id: number; name: string }>;
  teachers: Array<{ id: string; firstName: string; lastName: string }>;
  class: { id: number; name: string };
  branch: { id: number; shortName: string };
  academicYear?: { id: number; name: string };
}

interface StudentWeeklyTimetableProps {
  studentId: string;
  filters?: any;
  dateRange?: { start: Date; end: Date };
}

const StudentWeeklyTimetable = ({ 
  studentId,
  filters = {},
  dateRange 
}: StudentWeeklyTimetableProps) => {
  const { t } = useLanguage();

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Function to format day names for display
  const formatDayName = (day: string) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  // Optimized query with caching for super-fast performance
  const {
    data: timetables = [],
    isLoading: loading,
    error: fetchError,
    refetch
  } = useOptimizedQuery(
    ['student-weekly-timetables', studentId, JSON.stringify(filters)],
    async () => {
      const queryParams = new URLSearchParams({
        studentId,
        view: 'weekly',
        ...filters,
        ...(dateRange && {
          startDate: dateRange.start.toISOString().split('T')[0],
          endDate: dateRange.end.toISOString().split('T')[0],
        })
      });

      const response = await fetch(`/api/student-timetables?${queryParams}`, {
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': studentId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load timetable');
      }
      
      const data = await response.json();
      return data.timetables || [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchInterval: 0, // Manual refetch only
    }
  );

  const error = fetchError ? 'Failed to load timetable' : null;

  // Memoized function to get timetable for a specific slot (super-fast lookup)
  const getTimetableForSlot = useMemo(() => {
    // Create a map for O(1) lookup instead of O(n) find
    const slotMap = new Map<string, TimetableEntry>();
    
    timetables.forEach((entry: TimetableEntry) => {
      const [startHours, startMinutes] = entry.startTime.split(':').map(Number);
      const [endHours, endMinutes] = entry.endTime.split(':').map(Number);
      const startMinutesTotal = startHours * 60 + startMinutes;
      const endMinutesTotal = endHours * 60 + endMinutes;
      
      // Map all time slots within this lesson
      timeSlots.forEach(timeSlot => {
        const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
        const slotMinutesTotal = slotHours * 60 + slotMinutes;
        
        if (slotMinutesTotal >= startMinutesTotal && slotMinutesTotal < endMinutesTotal) {
          const key = `${entry.dayOfWeek}-${timeSlot}`;
          slotMap.set(key, entry);
        }
      });
    });
    
    return (day: string, timeSlot: string): TimetableEntry | undefined => {
      return slotMap.get(`${day}-${timeSlot}`);
    };
  }, [timetables]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7 * 10)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Error Loading Timetable</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8" />
            <div>
            <h2 className="text-2xl font-bold">My Weekly Timetable</h2>
            <p className="text-blue-100 text-sm mt-1">Your class schedule for the week</p>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[180px]">
                    {formatDayName(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((timeSlot, timeIndex) => (
                <tr key={timeSlot} className={timeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-xs font-medium text-gray-600 border-r border-gray-200 sticky left-0 z-10 bg-inherit">
                    <div className="flex flex-col items-center">
                      <Clock className="w-3 h-3 mb-1 text-gray-400" />
                      {timeSlot}
          </div>
                  </td>
                  {days.map(day => {
                    const timetable = getTimetableForSlot(day, timeSlot);
              
              return (
                      <td key={`${day}-${timeSlot}`} className="px-2 py-2 border-r border-gray-200 align-top">
                        {timetable && (
                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-md transition-all duration-200">
                            {/* Subjects */}
                            <div className="font-semibold text-sm text-gray-900 mb-2">
                              {timetable.subjects && timetable.subjects.length > 0 
                                ? timetable.subjects.map(s => s.name).join(' | ')
                                : 'No Subject'}
                  </div>
                  
                            {/* Time */}
                            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timetable.startTime} - {timetable.endTime}
                                </div>
                                
                            {/* Teachers */}
                            {timetable.teachers && timetable.teachers.length > 0 && (
                              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {timetable.teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ')}
                              </div>
                            )}
                            
                            {/* Room */}
                            {timetable.roomNumber && (
                              <div className="text-xs text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Room {timetable.roomNumber}
                                {timetable.buildingName && timetable.buildingName !== 'virtual' && ` (${timetable.buildingName})`}
                                </div>
                              )}
                            </div>
                              )}
                        {!timetable && (
                          <div className="h-20 flex items-center justify-center text-gray-400">
                            <span className="text-xs">-</span>
                          </div>
                        )}
                      </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
      </div>

      {/* Empty State */}
      {timetables.length === 0 && (
        <div className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Timetable Available</h3>
          <p className="text-gray-600">Your class timetable hasn't been set up yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentWeeklyTimetable;
