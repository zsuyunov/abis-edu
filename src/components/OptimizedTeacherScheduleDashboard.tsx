"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { useQuery } from "@tanstack/react-query";

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
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [gradeData, setGradeData] = useState<Record<string, number>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { prefetchQuery } = usePrefetch();

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

  // Set default branch
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

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
          return timetable.dayOfWeek === selectedDay;
        });

        const uniqueTimetables = filteredTimetables.filter((timetable: any, index: number, array: any[]) => {
          const uniqueKey = `${timetable.classId}-${timetable.subjectId}-${timetable.startTime}-${timetable.endTime}`;
          return array.findIndex((t: any) => 
            `${t.classId}-${t.subjectId}-${t.startTime}-${t.endTime}` === uniqueKey
          ) === index;
        });
        
        return uniqueTimetables.map((timetable: any) => ({
          id: timetable.id,
          fullDate: formattedDate,
          startTime: timetable.startTime ? new Date(timetable.startTime).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit' 
          }) : "00:00",
          endTime: timetable.endTime ? new Date(timetable.endTime).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit' 
          }) : "00:00",
          lessonNumber: timetable.lessonNumber || 1,
          classroom: timetable.roomNumber || timetable.buildingName || "Classroom",
          class: {
            ...timetable.class,
            academicYear: timetable.class.academicYear || timetable.academicYear || { id: 1, name: "Default" }
          },
          subject: timetable.subject,
          branch: timetable.branch,
          topics: timetable.topics || [],
          homework: timetable.homework || []
        }));
      } catch (error) {
        console.error('Error fetching timetables:', error);
        return []; // Return empty array on error
      }
    },
    {
      enabled: !!selectedBranchId,
      staleTime: 30 * 1000, // 30 seconds for ultra-fast updates
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: false,
    }
  );

  // Prefetch adjacent days for instant navigation
  useEffect(() => {
    if (selectedBranchId) {
      const currentDateObj = new Date(selectedDate);
      
      // Prefetch next day
      const nextDay = new Date(currentDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];
      
      // Prefetch previous day
      const prevDay = new Date(currentDateObj);
      prevDay.setDate(prevDay.getDate() - 1);
      const prevDateStr = prevDay.toISOString().split('T')[0];

      // Prefetch both days with a small delay to avoid blocking
      setTimeout(() => {
        [nextDateStr, prevDateStr].forEach(date => {
          prefetchQuery(
            ['teacher-timetables', teacherId, date, selectedBranchId, selectedRole],
            async () => {
              // Calculate weekly date range for recurring timetables
              const today = new Date(date);
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
              
              const startDate = startOfWeek.toISOString().split('T')[0];
              const endDate = endOfWeek.toISOString().split('T')[0];
              
              const response = await fetch(
                `/api/teacher-timetables?teacherId=${teacherId}&startDate=${startDate}&endDate=${endDate}&branchId=${selectedBranchId}&mode=${selectedRole.toLowerCase()}`,
                { headers: { 'x-user-id': teacherId } }
              );
              if (!response.ok) throw new Error(`Failed to prefetch: ${response.status}`);
              return response.json();
            },
            2 * 60 * 1000 // 2 minutes cache for prefetched data
          );
        });
      }, 500);
    }
  }, [teacherId, selectedDate, selectedBranchId, selectedRole, prefetchQuery]);

  // Topic mutation
  const topicMutation = useOptimizedMutation(
    async (topicData: { timetableId: string; title: string; description: string; }) => {
      const response = await fetch('/api/timetable-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          timetableId: topicData.timetableId,
          title: topicData.title,
          description: topicData.description,
          teacherId: teacherId,
        }),
      });
      if (!response.ok) throw new Error('Failed to save topic');
      return response.json();
    },
    {
      onSuccess: () => {
        setShowTopicModal(false);
        setNewTopic("");
        setNewTopicDescription("");
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
  const fetchStudents = useCallback(async (classId: string) => {
    setLoadingStudents(true);
    try {
      const response = await fetch(`/api/students/by-class?classId=${classId}`);
      if (response.ok) {
        const studentData = await response.json();
        setStudents(studentData);
        // Initialize attendance and grade data
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
        const initialGrades: Record<string, number> = {};
        studentData.forEach((student: any) => {
          initialAttendance[student.id] = 'present';
          initialGrades[student.id] = 0;
        });
        setAttendanceData(initialAttendance);
        setGradeData(initialGrades);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  // Handle modal opening
  const handleOpenAttendanceModal = useCallback((timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setShowAttendanceModal(true);
    fetchStudents(timetable.class.id);
  }, [fetchStudents]);

  const handleOpenGradeModal = useCallback((timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setShowGradeModal(true);
    fetchStudents(timetable.class.id);
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
    setNewTopicDescription(timetable.topics.length > 0 ? timetable.topics[0].description : "");
    setShowTopicModal(true);
    
    setIsActionLoading(false);
    setLoadingAction("");
  }, []);

  const handleOpenHomework = useCallback(async (timetable: TimetableEntry) => {
    setIsActionLoading(true);
    setLoadingAction("Opening homework manager...");
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setSelectedTimetable(timetable);
    setShowHomeworkModal(true);
    
    setIsActionLoading(false);
    setLoadingAction("");
  }, []);

  const handleOpenGrades = useCallback(async (timetable: TimetableEntry) => {
    setIsActionLoading(true);
    setLoadingAction("Opening grade book...");
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    handleOpenGradeModal(timetable);
    
    setIsActionLoading(false);
    setLoadingAction("");
  }, [handleOpenGradeModal]);

  const handleOpenAttendance = useCallback(async (timetable: TimetableEntry) => {
    setIsActionLoading(true);
    setLoadingAction("Opening attendance...");
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    handleOpenAttendanceModal(timetable);
    
    setIsActionLoading(false);
    setLoadingAction("");
  }, [handleOpenAttendanceModal]);

  const handleSaveTopic = useCallback(() => {
    if (!selectedTimetable || !newTopic.trim()) return;
    topicMutation.mutate({
      timetableId: selectedTimetable.id,
      title: newTopic.trim(),
      description: newTopicDescription.trim(),
    });
  }, [selectedTimetable, newTopic, newTopicDescription, topicMutation]);

  // Save attendance handler
  const handleSaveAttendance = useCallback(async () => {
    if (!selectedTimetable || students.length === 0) return;
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId
        },
        body: JSON.stringify({
          timetableId: selectedTimetable.id,
          classId: selectedTimetable.class.id,
          subjectId: selectedTimetable.subject.id,
          date: selectedTimetable.fullDate,
          attendance: Object.entries(attendanceData)
            .filter(([studentId, status]) => studentId && !isNaN(parseInt(studentId)) && status)
            .map(([studentId, status]) => ({
              studentId: parseInt(studentId),
              status: status.toUpperCase()
            }))
        })
      });

      if (response.ok) {
        setShowAttendanceModal(false);
        setAttendanceData({});
        // Show success message or refresh data
        console.log('Attendance saved successfully');
      } else {
        console.error('Failed to save attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  }, [selectedTimetable, students, attendanceData, teacherId]);

  // Save grades handler
  const handleSaveGrades = useCallback(async () => {
    if (!selectedTimetable || students.length === 0) return;
    
    const requestData = {
      timetableId: selectedTimetable.id,
      classId: selectedTimetable.class.id,
      subjectId: selectedTimetable.subject.id,
      date: selectedTimetable.fullDate,
      grades: Object.entries(gradeData)
        .filter(([studentId, points]) => studentId && !isNaN(parseInt(studentId)))
        .map(([studentId, points]) => ({
          studentId: parseInt(studentId),
          points: points || 0
        }))
    };
    
    console.log("Sending grades data:", requestData);
    console.log("Grade data state:", gradeData);
    console.log("Students data:", students);
    
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
        // Show success message or refresh data
        console.log('Grades saved successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to save grades:', errorData);
        alert(`Failed to save grades: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
    }
  }, [selectedTimetable, students, gradeData, teacherId]);

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
      {/* Header */}
      <motion.div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-lg">
              {teacherData.firstName[0]}{teacherData.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {teacherData.firstName} {teacherData.lastName}
              </h1>
              <p className="text-sm text-gray-600">
                {selectedRole === "TEACHER" ? "Subject Teacher" : "Supervisor"}
              </p>
            </div>
          </div>

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

            {/* Profile Update Button - Next to branch selector */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileModal(true)}
              className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium border border-blue-200"
              title="Update Profile"
            >
              <Settings className="w-3 h-3" />
            </motion.button>
          </div>
        </div>

        {/* Assignments */}
        <div className="flex flex-wrap gap-2 mt-4">
          {currentAssignments?.map((assignment, index) => (
            <div key={index} className="flex flex-wrap gap-1">
              <span className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 font-medium border border-blue-200">
                {assignment.Class.name}
              </span>
              {assignment.Subject && (
                <span className="px-2 py-1 rounded-lg text-xs bg-purple-50 text-purple-700 font-medium border border-purple-200">
                  {assignment.Subject.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Calendar Navigation */}
      <motion.div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateWeek("prev")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {weekDays ? format(weekDays[0], "MMMM yyyy") : ""}
            </h2>
            {!isSameDay(selectedDate, new Date()) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                Today
              </motion.button>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateWeek("next")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
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
                whileTap={{ scale: 0.95 }}
                onClick={() => selectDate(day)}
                className={`p-3 rounded-xl text-center transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-lg"
                    : isTodayDate
                      ? "bg-orange-50 text-orange-700 border-2 border-orange-200"
                      : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {format(day, "EEE")}
                </div>
                <div className="text-lg font-bold">
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
        {isLoading ? (
          <TeacherSpeedLoader 
            isLoading={true} 
            message="Loading your schedule..."
          />
        ) : !Array.isArray(timetables) || timetables.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-gray-200/50"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes today</h3>
            <p className="text-gray-600">Enjoy your free time!</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-3">
            {(Array.isArray(timetables) ? timetables : []).map((timetable: any, index: number) => {
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
                  className={`${cardStyles} rounded-2xl p-4 border backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                        #{getLessonNumber(index)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={12} />
                        {timetable.branch.shortName} • {timetable.classroom}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusColor}`}>
                      {statusIcon}
                      {lessonStatus === 'upcoming' ? 'Upcoming' : lessonStatus === 'in-progress' ? 'Live' : 'Done'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                        {timetable.class.name} • {timetable.subject.name}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Clock size={14} />
                        {formatTime(timetable.startTime)} – {formatTime(timetable.endTime)}
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        {timetable.topics.length > 0 
                          ? timetable.topics[0].title 
                          : "No lesson topic set"
                        }
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditTopic(timetable)}
                        disabled={selectedRole === "SUPERVISOR"}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Edit3 size={12} />
                        Topics
                      </motion.button>
                    </div>

                    {/* Action buttons */}
                    {selectedRole !== "SUPERVISOR" && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenHomework(timetable)}
                          disabled={isActionLoading}
                          className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                          title="Assign Homework"
                        >
                          <BookOpen size={16} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenAttendance(timetable)}
                          disabled={isActionLoading}
                          className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                          title="Take Attendance"
                        >
                          <Users size={16} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOpenGrades(timetable)}
                          disabled={isActionLoading}
                          className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center shadow-sm disabled:opacity-50"
                          title="Input Grades"
                        >
                          <BarChart3 size={16} />
                        </motion.button>
                      </div>
                    )}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTopicDescription}
                    onChange={(e) => setNewTopicDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter topic description"
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
                    {selectedTimetable.class.name} • {selectedTimetable.subject.name}
                  </h4>
                  <p className="text-sm text-purple-700">
                    {formatTime(selectedTimetable.startTime)} – {formatTime(selectedTimetable.endTime)}
                  </p>
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
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg">
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
                              min="0"
                              max="100"
                              value={gradeData[student.id] || 0}
                              onChange={(e) => {
                                const newGradeData = {
                                  ...gradeData,
                                  [student.id]: parseInt(e.target.value) || 0
                                };
                                console.log("Updating grade data:", newGradeData, "for student:", student.id);
                                setGradeData(newGradeData);
                              }}
                              className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                              placeholder="0"
                            />
                            <span className="text-xs sm:text-sm text-gray-500">/100</span>
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
                  onClick={() => setShowAttendanceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    {selectedTimetable.class.name} • {selectedTimetable.subject.name}
                  </h4>
                  <p className="text-sm text-green-700">
                    {formatTime(selectedTimetable.startTime)} – {formatTime(selectedTimetable.endTime)}
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Student Attendance</h4>
                  {loadingStudents ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs sm:text-sm font-medium text-green-700">
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
                          <select
                            value={attendanceData[student.id] || 'present'}
                            onChange={(e) => setAttendanceData(prev => ({
                              ...prev,
                              [student.id]: e.target.value as 'present' | 'absent' | 'late'
                            }))}
                            className="px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent flex-shrink-0"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
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
                    onClick={() => setShowAttendanceModal(false)}
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
