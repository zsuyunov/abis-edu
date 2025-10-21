"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Check, X, Clock, Shield } from "lucide-react";
import { useErrorToast } from "@/components/ui/Toast";
import { TableSkeleton, CardSkeleton } from "@/components/ui/GlobalLoader";
import { motion, AnimatePresence } from "framer-motion";

interface Branch {
  id: string;
  name: string;
  shortName: string;
  district: string;
}

interface AcademicYear {
  id: string;
  year: string;
  status: string;
}

interface Class {
  id: string;
  name: string;
  level: number;
}

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
}

interface AttendanceData {
  id: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  date: string;
  lessonNumber?: number;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subject: {
    id: string;
    name: string;
  };
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Statistics
  const [statistics, setStatistics] = useState<any>(null);

  // Animation state for lesson swapping
  const [showingLesson, setShowingLesson] = useState<1 | 2>(1);
  const [isSwapping, setIsSwapping] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const errorToast = useErrorToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedAcademicYear) {
      fetchClasses();
    }
  }, [selectedBranch, selectedAcademicYear]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchSubjectsForClass();
      setSelectedSubject("");
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && selectedClass && selectedSubject) {
      fetchAttendance();
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, currentDate]);

  // Check if lesson 2 exists for swap animation
  const hasLesson2 = () => {
    if (!Array.isArray(attendance) || attendance.length === 0) return false;
    return attendance.some(r => r.lessonNumber === 2);
  };

  // Auto-swap between lesson 1 and 2 every 3 seconds ONLY if at least one student has both lessons
  useEffect(() => {
    setIsSwapping(false);
    setShowingLesson(1);
    
    // Check if ANY student has BOTH lesson 1 and lesson 2 records
    const anyStudentHasBothLessons = attendance.some(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      const recordsForDate = attendance.filter(r => 
        r.student.id === record.student.id && 
        format(new Date(r.date), 'yyyy-MM-dd') === dateStr
      );
      
      const hasLesson1 = recordsForDate.some(r => r.lessonNumber === 1 || !r.lessonNumber);
      const hasLesson2 = recordsForDate.some(r => r.lessonNumber === 2);
      
      return hasLesson1 && hasLesson2;
    });
    
    // If NO student has both lessons, DO NOT start any animation
    if (!anyStudentHasBothLessons) {
      return; // Exit early, no timer created
    }

    // If at least one student has both lessons, start the swap animation
    const timer = setInterval(() => {
      setShowingLesson(prev => prev === 1 ? 2 : 1);
      setIsSwapping(true);
      setTimeout(() => setIsSwapping(false), 300);
    }, 3000);

    return () => clearInterval(timer);
  }, [attendance]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log("Fetching initial data for attendance page...");
      
      const [branchesRes, academicYearsRes, subjectsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/academic-years"),
        fetch("/api/subjects"),
      ]);

      console.log("API responses:", {
        branches: branchesRes.status,
        academicYears: academicYearsRes.status,
        subjects: subjectsRes.status
      });

      if (!branchesRes.ok || !academicYearsRes.ok || !subjectsRes.ok) {
        console.error("API calls failed:", {
          branches: branchesRes.status,
          academicYears: academicYearsRes.status,
          subjects: subjectsRes.status
        });
        throw new Error(`API calls failed: ${branchesRes.status}, ${academicYearsRes.status}, ${subjectsRes.status}`);
      }

      const [branchesData, academicYearsData, subjectsData] = await Promise.all([
        branchesRes.json(),
        academicYearsRes.json(),
        subjectsRes.json(),
      ]);

      console.log("Fetched data:", {
        branches: branchesData?.length || 0,
        academicYears: academicYearsData?.length || 0,
        subjects: subjectsData?.length || 0
      });

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setAcademicYears(Array.isArray(academicYearsData) ? academicYearsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setFilteredSubjects([]);

    } catch (error) {
      console.error("Error fetching initial data:", error);
      errorToast("Error", "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`/api/classes?branchId=${selectedBranch}&academicYearId=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students/by-class?classId=${selectedClass}`);
      if (response.ok) {
        const result = await response.json();
        const students = result.success ? result.data : result;
        setStudents(Array.isArray(students) ? students : []);
      } else {
        console.error("Failed to fetch students. Status:", response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };

  const fetchSubjectsForClass = async () => {
    try {
      console.log("Fetching subjects for class:", selectedClass);
      const response = await fetch(`/api/subjects/by-class?classId=${selectedClass}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched subjects for class:", data);
        setFilteredSubjects(Array.isArray(data) ? data : []);
      } else {
        console.log("API failed, showing all subjects");
        setFilteredSubjects(subjects);
      }
    } catch (error) {
      console.error("Error fetching subjects for class:", error);
      setFilteredSubjects(subjects);
    }
  };

  const fetchAttendance = async () => {
    try {
      setError(null);
      console.log("Fetching attendance with params:", {
        selectedBranch,
        selectedAcademicYear,
        selectedClass,
        selectedSubject,
        currentDate: format(currentDate, 'yyyy-MM')
      });
      
      const params = new URLSearchParams({
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear }),
        ...(selectedClass && { classId: selectedClass }),
        ...(selectedSubject && { subjectId: selectedSubject }),
        month: format(currentDate, 'yyyy-MM'),
      });

      console.log("API URL:", `/api/admin/attendance?${params}`);
      const attendanceRes = await fetch(`/api/admin/attendance?${params}`);

      console.log("Attendance response status:", attendanceRes.status);
      
      if (!attendanceRes.ok) {
        const errorText = await attendanceRes.text();
        console.error("Attendance API error:", errorText);
        
        // Don't throw error for 401/403 - just log and continue
        if (attendanceRes.status === 401 || attendanceRes.status === 403) {
          console.log("Authentication error - continuing without data");
          setAttendance([]);
          return;
        }
        
        throw new Error(`Failed to fetch attendance: ${attendanceRes.status} ${errorText}`);
      }

      const attendanceData = await attendanceRes.json();
      console.log("Fetched attendance data:", attendanceData);

      if (attendanceData.success && attendanceData.data) {
        setAttendance(attendanceData.data.attendance || []);
        console.log("Set attendance:", attendanceData.data.attendance?.length || 0, "records");
      } else {
        console.log("No attendance data found");
        setAttendance([]);
      }
      
      // Try to fetch statistics, but don't fail if it doesn't work
      try {
        const statsRes = await fetch(`/api/attendance/statistics?${params}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(statsData.data || null);
        }
      } catch (statsError) {
        console.log("Statistics fetch failed, continuing without stats:", statsError);
        setStatistics(null);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to fetch attendance");
      errorToast("Error", "Failed to load attendance");
    }
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Attendance helper functions
  const getAttendanceForStudentAndDate = (studentId: string, date: Date) => {
    if (!Array.isArray(attendance)) {
      console.log("Attendance is not an array:", attendance);
      return [];
    }
    const filtered = attendance.filter(record => 
      record.student.id === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    console.log(`Attendance for student ${studentId} on ${format(date, 'yyyy-MM-dd')}:`, filtered);
    return filtered;
  };

  const getAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(record => record.status === 'PRESENT').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const getTotalAttendance = () => {
    return attendance.length;
  };

  const getPresentCount = () => {
    return attendance.filter(record => record.status === 'PRESENT').length;
  };

  const getAbsentCount = () => {
    return attendance.filter(record => record.status === 'ABSENT').length;
  };

  // Attendance status color functions
  const getAttendanceCellColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500 border-green-500";
      case "ABSENT":
        return "bg-red-500 border-red-500";
      case "LATE":
        return "bg-yellow-500 border-yellow-500";
      case "EXCUSED":
        return "bg-blue-500 border-blue-500";
      default:
        return "bg-gray-400 border-gray-400";
    }
  };

  const getAttendanceTextColor = () => {
    return "text-white";
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "✓";
      case "ABSENT":
        return "✗";
      case "LATE":
        return "⏰";
      case "EXCUSED":
        return "📋";
      default:
        return "-";
    }
  };

  // Get attendance for specific student, date, and lesson
  const getAttendanceForStudentAndDateAndLesson = (studentId: string, date: Date, lessonNum: number = 1) => {
    if (!Array.isArray(attendance)) return null;
    return attendance.find(record => 
      record.student.id === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      (record.lessonNumber === lessonNum || (!record.lessonNumber && lessonNum === 1))
    );
  };

  // Get attendance to display based on showing lesson (for swap animation)
  const getDisplayAttendance = (studentId: string, date: Date) => {
    // Only use swap animation if this specific student has both lessons on this date
    const hasBothLessonsForThisStudent = studentHasBothLessons(studentId, date);
    const lessonToShow = hasBothLessonsForThisStudent ? showingLesson : 1;
    return getAttendanceForStudentAndDateAndLesson(studentId, date, lessonToShow);
  };

  // Check if student has both lessons on a date
  const studentHasBothLessons = (studentId: string, date: Date): boolean => {
    if (!Array.isArray(attendance)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const studentRecords = attendance.filter(r => 
      r.student.id === studentId && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateStr
    );
    
    const hasLesson1 = studentRecords.some(r => r.lessonNumber === 1 || !r.lessonNumber);
    const hasLesson2Records = studentRecords.some(r => r.lessonNumber === 2);
    
    return hasLesson1 && hasLesson2Records;
  };

  // Get status icon component
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'PRESENT': return <Check className="w-4 h-4 text-white" />;
      case 'ABSENT': return <X className="w-4 h-4 text-white" />;
      case 'LATE': return <Clock className="w-4 h-4 text-white" />;
      case 'EXCUSED': return <Shield className="w-4 h-4 text-white" />;
      default: return <span className="text-gray-500 text-sm font-medium">–</span>;
    }
  };

  // Get status color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'PRESENT': return 'bg-[#34C759] hover:bg-[#228B22] shadow-sm hover:shadow-md';
      case 'ABSENT': return 'bg-[#FF3B30] hover:bg-[#B22222] shadow-sm hover:shadow-md';
      case 'LATE': return 'bg-[#FFCC00] hover:bg-[#B8860B] shadow-sm hover:shadow-md';
      case 'EXCUSED': return 'bg-[#007AFF] hover:bg-[#1E3A8A] shadow-sm hover:shadow-md';
      default: return 'bg-[#D1D5DB] hover:bg-[#4B5563] shadow-sm hover:shadow-md';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={8} cols={6} />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">
            View and analyze student attendance across all subjects and classes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName} ({branch.district})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year} ({year.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || !selectedBranch || !selectedAcademicYear}
            >
              <option value="">
                {!selectedBranch || !selectedAcademicYear ? "Select Branch & Academic Year First" : 
                 classes.length === 0 ? "No Classes Found" : 
                 "Select Class"}
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                console.log("Subject selected:", e.target.value);
                setSelectedSubject(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || !selectedClass}
            >
              <option value="">
                {!selectedClass ? "Select Class First" : 
                 filteredSubjects.length === 0 ? "No Subjects Assigned" : 
                 "Select Subject"}
              </option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Selection Message */}
      {(!selectedBranch || !selectedAcademicYear || !selectedClass || !selectedSubject) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Select Filters to View Attendance</h3>
            <p className="text-blue-700">
              Please select a Branch, Academic Year, Class, and Subject to view the attendance calendar.
            </p>
          </div>
        </div>
      )}

      {/* Attendance Calendar */}
      {selectedBranch && selectedAcademicYear && selectedClass && selectedSubject && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Attendance Calendar</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <h4 className="text-lg font-semibold text-gray-900 px-4">
                  {format(currentDate, 'MMMM yyyy')}
                </h4>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Statistics for Calendar View */}
          {students.length > 0 && attendance.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Total Students</h4>
                  <p className="text-2xl font-bold text-blue-900">{students.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Total Records</h4>
                  <p className="text-2xl font-bold text-green-900">{getTotalAttendance()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                  <h4 className="text-sm font-medium text-orange-700 mb-1">Attendance Rate</h4>
                  <p className="text-2xl font-bold text-orange-900">{getAttendanceRate()}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700 mb-1">Subject</h4>
                  <p className="text-lg font-bold text-purple-900">
                    {(() => {
                      console.log("Selected subject ID:", selectedSubject);
                      console.log("Filtered subjects:", filteredSubjects);
                      console.log("All subjects:", subjects);
                      
                      const filteredSubject = filteredSubjects.find(s => s.id.toString() === selectedSubject);
                      const allSubject = subjects.find(s => s.id.toString() === selectedSubject);
                      
                      console.log("Found in filtered:", filteredSubject);
                      console.log("Found in all:", allSubject);
                      
                      return filteredSubject?.name || allSubject?.name || 'N/A';
                    })()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200 shadow-sm">
                  <h4 className="text-sm font-medium text-indigo-700 mb-1">Teacher</h4>
                  <p className="text-lg font-bold text-indigo-900">
                    {attendance.length > 0 ? `${attendance[0].teacher.firstName} ${attendance[0].teacher.lastName}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Calendar Grid */}
          {students.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="max-h-80 sm:max-h-96 overflow-auto">
                <table className="min-w-full">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr>
                      <th className="sticky left-0 z-20 bg-white px-4 sm:px-8 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[180px] sm:min-w-[220px] border-r border-gray-200">
                        Student Name
                      </th>
                      {monthDays.map(day => (
                        <th key={day.toISOString()} className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[50px] sm:min-w-[60px]">
                          <div className="text-sm sm:text-base font-bold">{format(day, 'dd')}</div>
                          <div className="text-xs text-gray-500 font-normal">{format(day, 'EEE')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {students.map((student, index) => (
                      <tr 
                        key={student.id} 
                        id={`student-${student.id}`}
                        className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      >
                        <td className="sticky left-0 z-20 bg-white px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[180px] sm:min-w-[220px] border-r border-gray-200">
                          <div className="font-bold text-gray-900">{student.lastName}, {student.firstName} {student.patronymic || ''}</div>
                        </td>
                        {monthDays.map(day => {
                          const hasBothLessons = studentHasBothLessons(student.id, day);
                          const attendanceRecord = getDisplayAttendance(student.id, day);
                          return (
                            <td 
                              key={day.toISOString()} 
                              className="px-2 sm:px-3 py-3 sm:py-4 text-center min-w-[50px] sm:min-w-[60px]"
                            >
                              <div className="relative">
                                <motion.button
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 transform ${
                                    hasLesson2() && isSwapping ? 'scale-95 opacity-70' : ''
                                  } ${getStatusColor(attendanceRecord?.status || undefined)}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <AnimatePresence mode="wait">
                                    <motion.div
                                      key={attendanceRecord?.status || 'none'}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{
                                        duration: 0.2,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      {getStatusIcon(attendanceRecord?.status || undefined)}
                                    </motion.div>
                                  </AnimatePresence>
                                </motion.button>
                                {hasBothLessons && hasLesson2() && (
                                  <AnimatePresence mode="wait">
                                    <motion.span 
                                      key={showingLesson}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{
                                        duration: 0.2,
                                        ease: "easeInOut"
                                      }}
                                      className="absolute -top-1 -right-1 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg"
                                    >
                                      L{showingLesson}
                                    </motion.span>
                                  </AnimatePresence>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {!selectedClass || !selectedSubject ? (
                "Please select both a class and subject to view the attendance calendar."
              ) : (
                "No students found for the selected class."
              )}
            </div>
          )}

          {/* Legend */}
          {students.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded text-white text-xs font-bold flex items-center justify-center">✓</div>
                  <span className="text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded text-white text-xs font-bold flex items-center justify-center">✗</div>
                  <span className="text-gray-600">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded text-white text-xs font-bold flex items-center justify-center">⏰</div>
                  <span className="text-gray-600">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs font-bold flex items-center justify-center">📋</div>
                  <span className="text-gray-600">Excused</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-400 rounded text-white text-xs font-bold flex items-center justify-center">-</div>
                  <span className="text-gray-600">No Record</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}