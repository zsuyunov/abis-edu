"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, MapPin, BookOpen, Users, BarChart3, ChevronLeft, ChevronRight,
  Edit3, CheckCircle, AlertCircle, PlayCircle, User, Settings
} from "lucide-react";
import { useOptimizedQuery, useOptimizedMutation, usePrefetch, useMemoizedSelector } from "@/hooks/useOptimizedQuery";
import { TeacherHomeworkContainerLazy, AttendanceFormLazy, GradeInputFormLazy } from "@/components/lazy/LazyComponents";
import TeacherHomeworkCreationForm from "./TeacherHomeworkCreationForm";
import ProfileUpdateModal from "./ProfileUpdateModal";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import FastLoader from "@/components/ui/FastLoader";
import TeacherSpeedLoader from "@/components/ui/TeacherSpeedLoader";
import { useTimetableCache } from '@/contexts/TimetableCacheContext';

interface TeacherAssignment {
  id: string;
  role: "TEACHER" | "SUPERVISOR";
  Branch: { id: string; name: string; shortName: string; };
  Class: { id: string; name: string; branch: { id: string; name: string; }; };
  Subject: { id: string; name: string; } | null;
  AcademicYear: { id: string; name: string; };
}

interface TimetableEntry {
  id: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  classroom: string;
  class: { id: string; name: string; academicYear?: { id: number; name: string; }; };
  subject: { id: string; name: string; };
  branch: { id: string; shortName: string; };
  academicYear?: { id: string; name: string; };
  topics: Array<{ id: string; title: string; description: string; }>;
  homework?: Array<{ id: string; title: string; description: string; }>;
}

interface TeacherScheduleDashboardProps {
  teacherId: string;
  teacherData: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    TeacherAssignment: TeacherAssignment[];
  };
}

const OptimizedTeacherScheduleDashboard = ({ teacherId, teacherData }: TeacherScheduleDashboardProps) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedRole, setSelectedRole] = useState<"TEACHER" | "SUPERVISOR">("TEACHER");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableEntry | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [attendanceComments, setAttendanceComments] = useState<Record<string, string>>({});
  const [gradeData, setGradeData] = useState<Record<string, number>>({});
  const [gradeComments, setGradeComments] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { prefetchQuery } = usePrefetch();
  const { getCachedData, setCachedData, isDataCached, preloadWeek, invalidateCache } = useTimetableCache();
  const commentsRef = useRef<Record<string, string>>({});


  // Memoized branches and roles
  const branches = useMemo(() => 
    Array.from(new Set(teacherData.TeacherAssignment.map(a => a.Branch.id)))
      .map(branchId => teacherData.TeacherAssignment.find(a => a.Branch.id === branchId)?.Branch)
      .filter(Boolean) as TeacherAssignment["Branch"][]
  , [teacherData.TeacherAssignment]);

  const hasTeacherRole = useMemo(() => 
    teacherData.TeacherAssignment.some(a => a.role === "TEACHER")
  , [teacherData.TeacherAssignment]);

  const hasSupervisorRole = useMemo(() => 
    teacherData.TeacherAssignment.some(a => a.role === "SUPERVISOR")
  , [teacherData.TeacherAssignment]);

  // Set default branch and instant preload
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // INSTANT preload entire week when branch is selected
  useEffect(() => {
    if (selectedBranchId && teacherId) {
      console.log('⚡ INSTANT preloading week for:', teacherId, selectedBranchId, selectedRole);
      preloadWeek(teacherId, selectedBranchId, selectedRole);
    }
  }, [selectedBranchId, teacherId, selectedRole, preloadWeek]);

  // Memoized date formatting
  const formattedDate = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Optimized query for schedule data with aggressive caching
  const {
    data: timetables = [],
    isLoading,
    error,
    refetch
  } = useOptimizedQuery(
    ['teacher-timetables', teacherId, formattedDate, selectedBranchId, selectedRole],
    async () => {
      if (!selectedBranchId) return [];
      
      // Check cache first
      const cacheKey = `${teacherId}-${formattedDate}-${selectedBranchId}-${selectedRole}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData && cachedData.length > 0) {
        return cachedData;
      }
      
      try {
        // Calculate weekly date range for recurring timetables
        const today = new Date(formattedDate);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        
        const startDate = startOfWeek.toISOString().split('T')[0];
        const endDate = endOfWeek.toISOString().split('T')[0];
        
        const response = await fetch(
          `/api/teacher-timetables?teacherId=${teacherId}&startDate=${startDate}&endDate=${endDate}&branchId=${selectedBranchId}&mode=${selectedRole.toLowerCase()}`,
          { 
            headers: { 'x-user-id': teacherId },
            cache: 'force-cache' // Aggressive browser caching
          }
        );
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        
        
        // Ensure data.timetables is an array
        const rawTimetables = Array.isArray(data.timetables) ? data.timetables : [];
        
        // Process and transform data - filter by day of week for recurring timetables
        const selectedDay = new Date(formattedDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const filteredTimetables = rawTimetables.filter((timetable: any) => {
          if (!timetable || typeof timetable !== 'object') return false;
          // For recurring timetables, match by dayOfWeek instead of fullDate
          return timetable.dayOfWeek?.toUpperCase() === selectedDay;
        });

        const uniqueTimetables = filteredTimetables.filter((timetable: any, index: number, array: any[]) => {
          const uniqueKey = `${timetable.classId}-${timetable.subjectId}-${timetable.startTime}-${timetable.endTime}`;
          return array.findIndex((t: any) => 
            `${t.classId}-${t.subjectId}-${t.startTime}-${t.endTime}` === uniqueKey
          ) === index;
        });
        
        return uniqueTimetables.map((timetable: any) => {
          // Handle both single subject and subjects array formats
          const subject = timetable.subject || (timetable.subjects && timetable.subjects.length > 0 ? timetable.subjects[0] : null);
          
          return {
            id: timetable.id,
            fullDate: formattedDate,
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
        
        // Process timetables for caching
        const processedTimetables = uniqueTimetables.map((timetable: any) => {
          // Handle both single subject and subjects array formats
          const subject = timetable.subject || (timetable.subjects && timetable.subjects.length > 0 ? timetable.subjects[0] : null);
          
          return {
            id: timetable.id,
            fullDate: formattedDate,
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

        // ALWAYS cache the result, even if empty array - this prevents stuck loading
        setCachedData(cacheKey, processedTimetables);
        
        return processedTimetables;
      } catch (error) {
        console.error('Error fetching timetables:', error);
        // Cache empty result to prevent repeated failed requests
        setCachedData(cacheKey, []);
        return []; // Return empty array on error
      }
    },
    {
      enabled: !!selectedBranchId,
      staleTime: 10 * 60 * 1000, // 10 minutes - balanced stale time
      gcTime: 60 * 60 * 1000, // 1 hour cache - keep data much longer
      refetchOnWindowFocus: false, // Don't refetch on window focus (we handle this manually)
    }
  );

  // INSTANT loading state - show cached data immediately
  const instantTimetables = useMemo(() => {
    if (!selectedBranchId) return [];
    
    const cacheKey = `${teacherId}-${formattedDate}-${selectedBranchId}-${selectedRole}`;
    const cachedData = getCachedData(cacheKey);
    
    // If we have cached data (even if empty array), use it immediately
    if (cachedData !== null) {
      return cachedData;
    }
    
    // Fallback to query data if no cache
    return timetables;
  }, [teacherId, formattedDate, selectedBranchId, selectedRole, getCachedData, timetables]);

  // INSTANT loading state - no loading if we have cached data (even empty)
  const instantLoading = useMemo(() => {
    if (!selectedBranchId) return false;
    
    const cacheKey = `${teacherId}-${formattedDate}-${selectedBranchId}-${selectedRole}`;
    const cachedData = getCachedData(cacheKey);
    
    // If we have cached data (even if empty), never show loading
    if (cachedData !== null) {
      return false;
    }
    
    // Only show loading if no cached data and query is loading
    return isLoading;
  }, [teacherId, formattedDate, selectedBranchId, selectedRole, getCachedData, isLoading]);

  // Refresh cache when returning to dashboard (focus effect)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedBranchId && teacherId) {
        // Only refresh if cache is stale (older than 5 minutes)
        const cacheKey = `${teacherId}-${formattedDate}-${selectedBranchId}-${selectedRole}`;
        const cachedData = getCachedData(cacheKey);
        
        if (!cachedData) {
          // Force refresh the current day's data
          setRefreshTrigger(prev => prev + 1);
          // Also refresh the entire week
          preloadWeek(teacherId, selectedBranchId, selectedRole);
        } else {
        }
      }
    };

    // Disabled focus refresh to prevent excessive API calls
    // window.addEventListener('focus', handleFocus);
    // handleFocus();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedBranchId, teacherId, selectedRole, preloadWeek, formattedDate, getCachedData]);

  // Background sync disabled to prevent excessive API calls
  // useEffect(() => {
  //   if (selectedBranchId && teacherId) {
  //     const syncInterval = setInterval(() => {
  //       preloadWeek(teacherId, selectedBranchId, selectedRole);
  //     }, 5 * 60 * 1000); // Every 5 minutes

  //     return () => clearInterval(syncInterval);
  //   }
  // }, [selectedBranchId, teacherId, selectedRole, preloadWeek]);

  // Topic mutation
  const topicMutation = useOptimizedMutation(
    async (topicData: { timetableId: string; title: string; }) => {
      const response = await fetch('/api/timetable-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          timetableId: topicData.timetableId,
          title: topicData.title,
        }),
      });
      if (!response.ok) throw new Error('Failed to save topic');
      return response.json();
    },
    {
      onSuccess: async () => {
        setShowTopicModal(false);
        setNewTopic("");
        // Force immediate refresh by updating trigger
        setRefreshTrigger(prev => prev + 1);
        // Also refetch for extra safety
        await refetch();
      },
      invalidateQueries: [['teacher-timetables', teacherId, formattedDate, selectedBranchId, selectedRole]]
    }
  );

  // Memoized handlers
  const navigateWeek = useCallback(async (direction: "prev" | "next") => {
    setIsActionLoading(true);
    setLoadingAction(`Loading ${direction === 'prev' ? 'previous' : 'next'} week...`);
    
    // Add small delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setCurrentWeek(prev => direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1));
    
    setTimeout(() => {
      setIsActionLoading(false);
      setLoadingAction("");
    }, 300);
  }, []);

  const selectDate = useCallback(async (date: Date) => {
    setIsActionLoading(true);
    setLoadingAction("Loading schedule...");
    
    // Add small delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setSelectedDate(date);
    
    setTimeout(() => {
      setIsActionLoading(false);
      setLoadingAction("");
    }, 200);
  }, []);
  const goToToday = useCallback(async () => {
    setIsActionLoading(true);
    setLoadingAction("Going to today...");
    
    const today = new Date();
    
    // Add small delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setSelectedDate(today);
    setCurrentWeek(today);
    
    setTimeout(() => {
      setIsActionLoading(false);
      setLoadingAction("");
    }, 300);
  }, []);

  const formatTime = useCallback((time: string) => time.substring(0, 5), []);
  const getLessonNumber = useCallback((index: number) => index + 1, []);

  // Fetch students for a class
  const fetchStudents = useCallback(async (classId: number) => {
    setLoadingStudents(true);
    try {
      const response = await fetch(`/api/students/by-class?classId=${classId}`);
      if (response.ok) {
        const studentData = await response.json();
        setStudents(studentData);
        // Initialize attendance and grade data
        const initialAttendance: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
        const initialComments: Record<string, string> = {};
        const initialGrades: Record<string, number> = {};
        const initialGradeComments: Record<string, string> = {};
        studentData.forEach((student: any) => {
          initialAttendance[student.id] = 'present';
          // Initialize comments as empty strings for all students
          initialComments[student.id] = '';
          initialGradeComments[student.id] = '';
          initialGrades[student.id] = 0;
        });
        setAttendanceData(initialAttendance);
        setAttendanceComments(initialComments);
        setGradeData(initialGrades);
        setGradeComments(initialGradeComments);
        // Initialize the ref with empty comments
        commentsRef.current = initialComments;
      } else {
        console.error('OptimizedTeacherScheduleDashboard - Failed to fetch students:', response.status);
      }
    } catch (error) {
      console.error('OptimizedTeacherScheduleDashboard - Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // Handle modal opening
  const handleOpenAttendanceModal = useCallback((timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setShowAttendanceModal(true);
    fetchStudents(Number(timetable.class.id));
  }, [fetchStudents]);

  const handleOpenGradeModal = useCallback((timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setShowGradeModal(true);
    fetchStudents(Number(timetable.class.id));
  }, [fetchStudents]);

  const getLessonStatus = useCallback((timetable: TimetableEntry) => {
    const now = new Date();
    const lessonDate = new Date(timetable.fullDate);
    const [startHour, startMinute] = timetable.startTime.split(':').map(Number);
    const [endHour, endMinute] = timetable.endTime.split(':').map(Number);
    
    const lessonStart = new Date(lessonDate);
    lessonStart.setHours(startHour, startMinute, 0, 0);
    
    const lessonEnd = new Date(lessonDate);
    lessonEnd.setHours(endHour, endMinute, 0, 0);
    
    if (now < lessonStart) return 'upcoming';
    if (now > lessonEnd) return 'completed';
    return 'in-progress';
  }, []);

  const handleEditTopic = useCallback(async (timetable: TimetableEntry) => {
    setIsActionLoading(true);
    setLoadingAction("Opening topic editor...");
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setSelectedTimetable(timetable);
    setNewTopic(timetable.topics.length > 0 ? timetable.topics[0].title : "");
    setShowTopicModal(true);
    
    setIsActionLoading(false);
    setLoadingAction("");
  }, []);


  const handleSaveTopic = useCallback(() => {
    if (!selectedTimetable || !newTopic.trim()) return;
    topicMutation.mutate({
      timetableId: selectedTimetable.id,
      title: newTopic.trim(),
    });
  }, [selectedTimetable, newTopic, topicMutation]);

  // Save attendance handler
  const handleSaveAttendance = useCallback(async () => {
    
    if (!selectedTimetable || students.length === 0) {
      return;
    }

    // Force refresh of comment state by getting current values
    const currentComments = { ...attendanceComments };

    // Debug: Check each student's comment
    students.forEach(student => {
      console.log(`Student ${student.id} (${student.firstName} ${student.lastName}): comment = "${currentComments[student.id]}"`);
    });

    const attendanceArray = Object.entries(attendanceData)
      .filter(([studentId, status]) => studentId && status)
      .map(([studentId, status]) => {
        const comment = currentComments[studentId] || '';
        console.log(`Processing student ${studentId}: status=${status}, comment="${comment}"`);
        return {
          studentId: studentId, // Keep as string
          status: status.toUpperCase(),
          notes: comment
        };
      });


    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId
        },
        body: JSON.stringify({
          timetableId: parseInt(selectedTimetable.id),
          classId: parseInt(selectedTimetable.class.id),
          subjectId: parseInt(selectedTimetable.subject.id),
          date: selectedTimetable.fullDate,
          attendance: attendanceArray
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowAttendanceModal(false);
        setAttendanceData({});
        // Show success message or refresh data
        alert(`✅ Attendance saved successfully! Saved ${result.savedRecords || attendanceArray.length} records.`);
      } else {
        const errorData = await response.json();
        console.error('OptimizedTeacherScheduleDashboard - Failed to save attendance:', errorData);
        alert(`❌ Failed to save attendance: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('OptimizedTeacherScheduleDashboard - Error saving attendance:', error);
      alert(`💥 Error saving attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedTimetable, students, attendanceData, attendanceComments, teacherId]);

  // Save grades handler
  const handleSaveGrades = useCallback(async () => {
    if (!selectedTimetable || students.length === 0) return;
    
    
    // Force refresh of comment state by getting current values
    const currentGradeComments = { ...gradeComments };
    
    // Debug: Check each student's comment
    students.forEach(student => {
      console.log(`Student ${student.id} (${student.firstName} ${student.lastName}): grade comment = "${currentGradeComments[student.id]}"`);
    });
    
    const requestData = {
      timetableId: selectedTimetable.id,
      classId: selectedTimetable.class.id,
      subjectId: selectedTimetable.subject.id,
      date: selectedTimetable.fullDate,
      grades: Object.entries(gradeData)
        .filter(([studentId, points]) => {
          const isValid = studentId && points !== null && points !== undefined && points > 0;
          console.log(`Filtering student ${studentId}: points=${points}, type=${typeof points}, isValid=${isValid}`);
          return isValid;
        })
        .map(([studentId, points]) => {
          const comment = currentGradeComments[studentId] || '';
          console.log(`Processing grade for student ${studentId}: points=${points}, comment="${comment}"`);
          return {
            studentId: studentId,
            points: points,
            comments: comment
          };
        })
    };
    
    console.log("Sending grades data:", requestData);
    console.log("Grade data state:", gradeData);
    console.log("Grade data entries:", Object.entries(gradeData));
    console.log("Grade comments state:", gradeComments);
    console.log("Students data:", students);
    console.log("Student IDs from students:", students.map(s => s.id));
    console.log("Student IDs from gradeData keys:", Object.keys(gradeData));
    
    if (requestData.grades.length === 0) {
      console.log("No valid grades found. Showing all grade data for debugging:");
      console.log("All grade entries:", Object.entries(gradeData));
      console.log("All grade comments:", Object.entries(gradeComments));
      alert('Please enter at least one grade with a score greater than 0.');
      return;
    }
    
    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        setShowGradeModal(false);
        setGradeData({});
        setGradeComments({});
        // Show success message
        alert('✅ Grades saved successfully!');
        console.log('Grades saved successfully');
        
        // Trigger refresh of Grade Tracker
        window.dispatchEvent(new CustomEvent('gradeSaved'));
      } else {
        const errorData = await response.json();
        console.error('Failed to save grades:', errorData);
        alert(`Failed to save grades: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
    }
  }, [selectedTimetable, students, gradeData, gradeComments, teacherId]);

  const currentAssignments = useMemoizedSelector(
    teacherData.TeacherAssignment,
    (assignments) => assignments.filter(a => a.role === selectedRole && a.Branch.id === selectedBranchId),
    [selectedRole, selectedBranchId]
  );

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
      <motion.div className="flex items-center justify-center h-64">
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
      className="space-y-4"
    >
      {/* Header - Controls Only */}
      <motion.div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {(hasTeacherRole && hasSupervisorRole) && (
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setSelectedRole("TEACHER")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedRole === "TEACHER" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => setSelectedRole("SUPERVISOR")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedRole === "SUPERVISOR" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Supervisor
                </button>
              </div>
            )}

            {branches.length > 1 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName}
                  </option>
                ))}
              </select>
            )}

          </div>
        </div>

      </motion.div>

      {/* Calendar Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateWeek("prev")}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </motion.button>
          
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {weekDays ? format(weekDays[0], "MMMM yyyy") : ""}
            </h2>
            {!isSameDay(selectedDate, new Date()) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Today
              </motion.button>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateWeek("next")}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </motion.button>
        </div>
        
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-3">
          {weekDays?.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectDate(day)}
                className={`p-4 rounded-2xl text-center transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl"
                    : isTodayDate
                      ? "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 border-2 border-orange-300 shadow-lg"
                      : "hover:bg-gray-50 text-gray-700 hover:shadow-md"
                }`}
              >
                <div className="text-xs font-semibold mb-2 uppercase tracking-wide">
                  {format(day, "EEE")}
                </div>
                <div className="text-xl font-bold">
                  {format(day, "d")}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Global Action Loader */}
      <AnimatePresence>
        {isActionLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40"
          >
            <TeacherSpeedLoader 
              isLoading={true} 
              message={loadingAction}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Content */}
      <AnimatePresence mode="wait">
        {instantLoading ? (
          <TeacherSpeedLoader 
            isLoading={true} 
            message="Loading your schedule..."
          />
        ) : !Array.isArray(instantTimetables) || instantTimetables.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 text-center shadow-lg border border-blue-200/50"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-8xl mb-6"
            >
              🎉
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No lessons today</h3>
            <p className="text-lg text-gray-600 mb-6">Enjoy your free time!</p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div className="space-y-3">
            {(Array.isArray(instantTimetables) ? instantTimetables : []).map((timetable: any, index: number) => {
              const lessonStatus = getLessonStatus(timetable);
              
              let cardStyles = "";
              let statusIcon = null;
              let statusColor = "";
              
              switch (lessonStatus) {
                case 'upcoming':
                  cardStyles = "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-200/50";
                  statusIcon = <AlertCircle size={16} />;
                  statusColor = "bg-blue-100 text-blue-700 border-blue-200";
                  break;
                case 'in-progress':
                  cardStyles = "bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/50";
                  statusIcon = <PlayCircle size={16} />;
                  statusColor = "bg-green-100 text-green-700 border-green-200";
                  break;
                case 'completed':
                  cardStyles = "bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-gray-200/50";
                  statusIcon = <CheckCircle size={16} />;
                  statusColor = "bg-gray-100 text-gray-600 border-gray-200";
                  break;
              }
              
              return (
                <motion.div
                  key={timetable.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  className={`${cardStyles} rounded-2xl p-6 border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group`}
                >
                  {/* Header with Lesson Number and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg"
                      >
                        #{getLessonNumber(index)}
                      </motion.div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium">{timetable.branch?.shortName || 'Unknown Branch'}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500">{timetable.classroom || 'Classroom'}</span>
                      </div>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border shadow-sm ${statusColor}`}
                    >
                      {statusIcon}
                      <span>
                        {lessonStatus === 'upcoming' ? 'Upcoming' : lessonStatus === 'in-progress' ? 'Live' : 'Completed'}
                      </span>
                    </motion.div>
                  </div>

                  {/* Main Content */}
                  <div className="space-y-4">
                    {/* Class and Subject */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {timetable.class?.name || 'Unknown Class'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold rounded-full shadow-sm">
                          {timetable.subject?.name || 'Unknown Subject'}
                        </span>
                      </div>
                    </div>

                    {/* Time and Topic */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {formatTime(timetable.startTime)} – {formatTime(timetable.endTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-sm text-gray-600">
                            {timetable.topics.length > 0 
                              ? `📚 ${timetable.topics[0].title}` 
                              : "📝 No lesson topic set"
                            }
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditTopic(timetable)}
                          disabled={selectedRole === "SUPERVISOR"}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                        >
                          <Edit3 size={14} />
                          <span className="text-sm font-medium">Topics</span>
                        </motion.button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topic Modal */}
      <AnimatePresence>
        {showTopicModal && selectedTimetable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Lesson Topic</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter lesson topic"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTopicModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveTopic}
                  disabled={topicMutation.isPending || !newTopic.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {topicMutation.isPending ? (
                    <FastLoader isLoading={true} variant="spinner" size="sm" />
                  ) : "Save"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Homework Creation Form */}
      <AnimatePresence>
        {showHomeworkModal && selectedTimetable && (
          <TeacherHomeworkCreationForm
            teacherId={teacherId}
            timetable={{
              id: selectedTimetable.id,
              class: { 
                id: selectedTimetable.class.id, 
                name: selectedTimetable.class.name,
                academicYear: { id: parseInt(selectedTimetable.academicYear?.id || "1") }
              },
              subject: { 
                id: selectedTimetable.subject.id, 
                name: selectedTimetable.subject.name 
              },
              branch: { 
                id: selectedTimetable.branch.id, 
                shortName: selectedTimetable.branch.shortName 
              },
              fullDate: selectedTimetable.fullDate,
              startTime: selectedTimetable.startTime,
              endTime: selectedTimetable.endTime
            }}
            onClose={() => setShowHomeworkModal(false)}
            onHomeworkCreated={() => {
              setShowHomeworkModal(false);
              // Refresh data if needed
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>

      {/* Grade Modal */}
      <AnimatePresence>
        {showGradeModal && selectedTimetable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg shadow-xl max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Grade Book</h3>
                <button
                  onClick={() => setShowGradeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">
                    {selectedTimetable.class?.name || 'Unknown Class'} • {selectedTimetable.subject?.name || 'Unknown Subject'}
                  </h4>
                  <p className="text-sm text-purple-700">
                    {formatTime(selectedTimetable.startTime)} – {formatTime(selectedTimetable.endTime)}
                  </p>
                </div>
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search students by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Student Grades</h4>
                    {loadingStudents ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {students
                        .filter(student => 
                          searchTerm === '' || 
                          student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((student) => (
                        <div key={student.id} className="p-3 bg-white border border-gray-200 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs sm:text-sm font-medium text-purple-700">
                                  {student.firstName[0]}{student.lastName[0]}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={gradeData[student.id] ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const numericValue = value ? parseInt(value) : null;
                                  const newGradeData = {
                                    ...gradeData,
                                    [student.id]: numericValue
                                  };
                                  console.log("Updating grade data:", newGradeData, "for student:", student.id, "value:", value, "numericValue:", numericValue);
                                  setGradeData(newGradeData);
                                }}
                                className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                                placeholder="1-100"
                              />
                              <span className="text-xs sm:text-sm text-gray-500">/100</span>
                            </div>
                          </div>
                          
                          {/* Comments Section */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Comments (Optional)</label>
                            <textarea
                              value={gradeComments[student.id] || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const newComments = {
                                  ...gradeComments,
                                  [student.id]: newValue
                                };
                                setGradeComments(newComments);
                              }}
                              placeholder="Add comments about this student's performance..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No students found for this class</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowGradeModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGrades}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                  >
                    Save Grades
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && selectedTimetable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg shadow-xl max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Take Attendance</h3>
                <button
                  onClick={() => {
                    setShowAttendanceModal(false);
                    // Clear the ref when modal is closed
                    commentsRef.current = {};
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    {selectedTimetable.class?.name || 'Unknown Class'} • {selectedTimetable.subject?.name || 'Unknown Subject'}
                  </h4>
                  <p className="text-sm text-green-700">
                    {formatTime(selectedTimetable.startTime)} – {formatTime(selectedTimetable.endTime)}
                  </p>
                </div>
                
                {/* Search Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Search Students</label>
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Student Attendance</h4>
                  {loadingStudents ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {students
                        .filter(student => {
                          if (!searchTerm) return true;
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            student.firstName.toLowerCase().includes(searchLower) ||
                            student.lastName.toLowerCase().includes(searchLower) ||
                            student.studentId.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((student) => (
                        <div key={student.id} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-green-700">
                                  {student.firstName[0]}{student.lastName[0]}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                              </div>
                            </div>
                            <select
                              value={attendanceData[student.id] || 'present'}
                              onChange={(e) => setAttendanceData(prev => ({
                                ...prev,
                                [student.id]: e.target.value as 'present' | 'absent' | 'late' | 'excused'
                              }))}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent flex-shrink-0"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                              <option value="excused">Excused</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Comment (optional)</label>
                            <textarea
                              placeholder="Add a comment about this student's attendance..."
                              value={attendanceComments[student.id] || ''}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setAttendanceComments(prev => {
                                  const updated = {
                                    ...prev,
                                    [student.id]: newValue
                                  };
                                  return updated;
                                });
                                // Also update the ref to preserve comments
                                commentsRef.current[student.id] = newValue;
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No students found for this class</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAttendanceModal(false);
                      // Clear the ref when modal is closed
                      commentsRef.current = {};
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    Save Attendance
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Update Modal */}
      <ProfileUpdateModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        teacherId={teacherId}
        currentPhone={teacherData.phone || ""}
        onUpdateSuccess={() => {
          // Optionally refresh data or show success message
          console.log("Profile updated successfully");
        }}
      />
    </motion.div>
  );
};

export default OptimizedTeacherScheduleDashboard;
