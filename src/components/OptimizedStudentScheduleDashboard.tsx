"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, XCircle, AlertCircle, Calendar, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useOptimizedQuery, usePrefetch, useMemoizedSelector } from "@/hooks/useOptimizedQuery";
import { StudentAttendanceAnalyticsLazy, StudentGradeStatisticsLazy } from "@/components/lazy/LazyComponents";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface StudentBranch {
  id: number;
  legalName: string;
  shortName: string;
}

interface StudentClass {
  id: number;
  name: string;
  branch: StudentBranch;
}

interface TimetableEntry {
  id: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  classroom: string;
  subject: {
    id: string;
    name: string;
  };
  topics: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  attendance?: {
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  };
}

interface StudentScheduleDashboardProps {
  studentId: string;
  studentData: {
    id: string;
    firstName: string;
    lastName: string;
    branch: StudentBranch | null;
    class: StudentClass | null;
  };
}

const OptimizedStudentScheduleDashboard = ({ studentId, studentData }: StudentScheduleDashboardProps) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { prefetchQuery } = usePrefetch();

  // Get student's branch and class info
  const branchId = studentData.branch?.id;
  const classId = studentData.class?.id;

  // Memoized date formatting for API
  const formattedDate = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Optimized query for schedule data with caching
  const {
    data: timetables = [],
    isLoading,
    error,
    refetch
  } = useOptimizedQuery(
    ['student-timetables', studentId, formattedDate, branchId?.toString() || '', classId?.toString() || ''],
    async () => {
      if (!branchId || !classId) return [];
      
      const response = await fetch(
        `/api/student-timetables?studentId=${studentId}&startDate=${formattedDate}&endDate=${formattedDate}&branchId=${branchId}&classId=${classId}`,
        {
          headers: {
            'x-user-id': studentId,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter and transform data
      const filteredTimetables = (data.timetables || []).filter((timetable: any) => {
        const timetableDate = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        return timetableDate === formattedDate;
      });
      
      // Remove duplicates and transform
      const uniqueTimetables = filteredTimetables.filter((timetable: any, index: number, array: any[]) => {
        const currentKey = `${timetable.fullDate}-${timetable.startTime}-${timetable.subject?.id}`;
        return array.findIndex((t: any) => 
          `${t.fullDate}-${t.startTime}-${t.subject?.id}` === currentKey
        ) === index;
      });
      
      return uniqueTimetables.map((timetable: any) => {
        const dateStr = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        
        return {
          id: timetable.id,
          fullDate: dateStr,
          startTime: timetable.startTime || "00:00",
          endTime: timetable.endTime || "00:00",
          lessonNumber: timetable.lessonNumber || 1,
          classroom: timetable.roomNumber || timetable.buildingName || "Classroom",
          subject: timetable.subject,
          topics: timetable.topics || [],
          attendance: timetable.attendance
        };
      });
    },
    {
      enabled: !!branchId && !!classId,
      staleTime: 2 * 60 * 1000, // 2 minutes for schedule data
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

  // Prefetch adjacent days for smooth navigation
  useEffect(() => {
    if (branchId && classId) {
      const tomorrow = addDays(selectedDate, 1);
      const yesterday = subDays(selectedDate, 1);
      
      [tomorrow, yesterday].forEach(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        prefetchQuery(
          ['student-timetables', studentId, dateStr, branchId.toString(), classId.toString()],
          async () => {
            const response = await fetch(
              `/api/student-timetables?studentId=${studentId}&startDate=${dateStr}&endDate=${dateStr}&branchId=${branchId}&classId=${classId}`,
              { headers: { 'x-user-id': studentId } }
            );
            return response.ok ? response.json() : [];
          }
        );
      });
    }
  }, [selectedDate, branchId, classId, studentId, prefetchQuery]);

  // Memoized navigation handlers
  const navigateWeek = useCallback((direction: "prev" | "next") => {
    const newWeek = direction === "prev" 
      ? subWeeks(currentWeek, 1) 
      : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  }, [currentWeek]);

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeek(today);
  }, []);

  // Memoized utility functions
  const formatTime = useCallback((time: string) => time.substring(0, 5), []);
  const getLessonNumber = useCallback((index: number) => index + 1, []);

  // Memoized attendance utilities
  const getAttendanceIcon = useCallback((status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  }, []);

  const getAttendanceText = useCallback((status: string) => {
    switch (status) {
      case 'present':
        return t('student.attendance.present');
      case 'late':
        return t('student.attendance.late');
      case 'excused':
        return t('student.attendance.excused');
      case 'absent':
        return t('student.attendance.absent');
      default:
        return '';
    }
  }, [t]);

  const getAttendanceColor = useCallback((status: string) => {
    switch (status) {
      case 'present':
        return 'text-blue-600 bg-blue-50';
      case 'late':
        return 'text-yellow-600 bg-yellow-50';
      case 'excused':
        return 'text-green-600 bg-green-50';
      case 'absent':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }, []);

  // Memoized week days
  const weekDays = useMemoizedSelector(
    currentWeek,
    (week) => eachDayOfInterval({
      start: startOfWeek(week, { weekStartsOn: 1 }),
      end: endOfWeek(week, { weekStartsOn: 1 })
    }),
    [currentWeek]
  );

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Error loading schedule</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Header with Student Info */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('student.dashboard.title')}</h1>
              <p className="text-sm text-gray-600">Your daily schedule and activities</p>
            </div>
          </div>
          
          {/* Student Info Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 bg-gradient-to-r from-white to-gray-50 rounded-xl p-3 shadow-sm border border-gray-100"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-bold flex items-center justify-center">
              {studentData.firstName[0]}{studentData.lastName[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {studentData.firstName} {studentData.lastName}
              </div>
              <div className="text-xs text-gray-600">
                {studentData.class?.name} - {studentData.branch?.shortName}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Calendar Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek("prev")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {weekDays ? format(weekDays[0], "MMMM yyyy") : ""}
              </h2>
              {!isSameDay(selectedDate, new Date()) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  Today
                </motion.button>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek("next")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
          
          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays?.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <motion.button
                  key={day.toISOString()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectDate(day)}
                  className={`p-3 rounded-xl text-center transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                      : isTodayDate
                        ? "bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 border border-orange-300"
                        : "hover:bg-gray-100 text-gray-700 bg-white/50"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-sm font-bold">
                    {format(day, "d")}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Schedule Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <SkeletonLoader variant="timetable" count={3} />
          ) : timetables.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes today</h3>
              <p className="text-gray-600">Enjoy your free time!</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-3"
            >
              {timetables.map((timetable: any, index: number) => {
                const lessonDate = new Date(timetable.fullDate + 'T' + timetable.startTime);
                const lessonEndDate = new Date(timetable.fullDate + 'T' + timetable.endTime);
                const now = new Date();
                
                const isPastLesson = lessonEndDate < now;
                
                const cardStyles = isPastLesson 
                  ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200" 
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";
                
                return (
                  <motion.div
                    key={timetable.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className={`${cardStyles} p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="text-lg font-bold text-gray-900">
                        {timetable.subject.name}
                      </div>
                      
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(timetable.startTime)} – {formatTime(timetable.endTime)}
                      </div>

                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {timetable.topics && timetable.topics.length > 0 
                          ? timetable.topics[0].title 
                          : "No lesson topic"
                        }
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          isPastLesson 
                            ? "bg-gray-100 text-gray-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {isPastLesson ? 'Completed' : 'Upcoming'}
                        </div>
                        
                        {isPastLesson && timetable.Attendance && timetable.Attendance.length > 0 && (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700`}>
                            ✓ <span className="hidden sm:inline">Present</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Sections */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 {t('student.dashboard.attendance')}
            </h3>
            <StudentAttendanceAnalyticsLazy studentId={studentId} />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📈 {t('student.dashboard.academicPerformance')}
            </h3>
            <StudentGradeStatisticsLazy studentId={studentId} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default OptimizedStudentScheduleDashboard;
