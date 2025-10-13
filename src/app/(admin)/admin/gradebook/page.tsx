"use client";

import { useState, useEffect } from "react";
import { useLoading } from "@/components/providers/LoadingProvider";
import { useErrorToast, useSuccessToast } from "@/components/ui/Toast";
import { TableSkeleton, CardSkeleton, ChartSkeleton } from "@/components/ui/GlobalLoader";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, BookOpen, GraduationCap } from 'lucide-react';

interface GradeData {
  id: string;
  value: number;
  type: string;
  subject: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  comment?: string;
  timetable?: {
    id: number;
    startTime: string;
    endTime: string;
    subject: {
      name: string;
    };
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface Branch {
  id: string;
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
  branchId: string;
  academicYearId: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function GradebookPage() {
  const [grades, setGrades] = useState<GradeData[]>([]);
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { showLoader, hideLoader } = useLoading();
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch grades when filters change
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && selectedClass && selectedSubject) {
      fetchGrades();
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, currentDate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      console.log("Starting to fetch initial data...");
      
      const [branchesRes, academicYearsRes, subjectsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/academic-years"),
        fetch("/api/subjects"),
      ]);

      if (!branchesRes.ok || !academicYearsRes.ok || !subjectsRes.ok) {
        throw new Error(`API calls failed: ${branchesRes.status}, ${academicYearsRes.status}, ${subjectsRes.status}`);
      }

      const [branchesData, academicYearsData, subjectsData] = await Promise.all([
        branchesRes.json(),
        academicYearsRes.json(),
        subjectsRes.json(),
      ]);

      // Handle different response formats
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setAcademicYears(Array.isArray(academicYearsData) ? academicYearsData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setFilteredSubjects([]); // Start with empty filtered subjects

      // Don't set default selections - keep all as "All" options
    } catch (error) {
      console.error("Error fetching initial data:", error);
      errorToast("Error", "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes when branch or academic year changes
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear) {
      fetchClasses();
    }
  }, [selectedBranch, selectedAcademicYear]);

  // Fetch students when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchSubjectsForClass();
      setSelectedSubject(""); // Reset subject selection
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(
        `/api/classes?branchId=${selectedBranch}&academicYearId=${selectedAcademicYear}`
      );
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : []);
      setSelectedClass(""); // Reset class selection
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students/by-class?classId=${selectedClass}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
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
        // If API fails, show all subjects as fallback
        setFilteredSubjects(subjects);
      }
    } catch (error) {
      console.error("Error fetching subjects for class:", error);
      // If API fails, show all subjects as fallback
      setFilteredSubjects(subjects);
    }
  };

  const fetchGrades = async () => {
    try {
      setError(null);
      console.log("Fetching grades with params:", {
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

      console.log("API URL:", `/api/admin/grades?${params}`);
      const gradesRes = await fetch(`/api/admin/grades?${params}`);

      console.log("Grades response status:", gradesRes.status);
      
      if (!gradesRes.ok) {
        const errorText = await gradesRes.text();
        console.error("Grades API error:", errorText);
        throw new Error(`Failed to fetch grades: ${gradesRes.status} ${errorText}`);
      }

      const gradesData = await gradesRes.json();
      console.log("Fetched grades data:", gradesData);

      if (gradesData.success && gradesData.data) {
        setGrades(gradesData.data.grades || []);
        console.log("Set grades:", gradesData.data.grades?.length || 0, "grades");
      } else {
        console.log("No grades data found");
        setGrades([]);
      }
      
      // Try to fetch statistics, but don't fail if it doesn't work
      try {
        const statsRes = await fetch(`/api/grades/statistics?${params}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(statsData.data || null);
        }
      } catch (statsError) {
        console.log("Statistics fetch failed, continuing without stats:", statsError);
        setStatistics(null);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      setError("Failed to fetch grades");
      errorToast("Error", "Failed to load grades");
    }
  };

  const getGradeColor = (value: number) => {
    if (value >= 90) return "text-green-600 bg-green-50";
    if (value >= 80) return "text-blue-600 bg-blue-50";
    if (value >= 70) return "text-yellow-600 bg-yellow-50";
    if (value >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getGradeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "exam":
        return "bg-purple-100 text-purple-800";
      case "quiz":
        return "bg-blue-100 text-blue-800";
      case "homework":
        return "bg-green-100 text-green-800";
      case "project":
        return "bg-orange-100 text-orange-800";
      case "participation":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Grade helper functions
  const getGradesForStudentAndDate = (studentId: string, date: Date) => {
    if (!Array.isArray(grades)) {
      console.log("Grades is not an array:", grades);
      return [];
    }
    const filtered = grades.filter(record => 
      record.student.id === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    console.log(`Grades for student ${studentId} on ${format(date, 'yyyy-MM-dd')}:`, filtered);
    return filtered;
  };

  const getStudentAverage = (studentId: string) => {
    const studentGrades = grades.filter(grade => grade.student.id === studentId);
    if (studentGrades.length === 0) return 0;
    const sum = studentGrades.reduce((acc, grade) => acc + grade.value, 0);
    return Math.round(sum / studentGrades.length);
  };

  const getClassAverage = () => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
    return Math.round(sum / grades.length);
  };

  // Grade color functions for calendar cells - EXACT colors from legend
  const getGradeCellColor = (value: number) => {
    if (value >= 90) return "bg-green-500 border-green-500"; // Green like legend
    if (value >= 80) return "bg-blue-500 border-blue-500"; // Blue like legend
    if (value >= 70) return "bg-teal-500 border-teal-500"; // Teal like legend
    if (value >= 60) return "bg-orange-500 border-orange-500"; // Orange like legend
    if (value >= 40) return "bg-red-500 border-red-500"; // Red like legend
    return "bg-red-700 border-red-700"; // Dark red like legend
  };

  const getGradeTextColor = (value: number) => {
    return "text-white"; // All text is white like in legend
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
            <ChartSkeleton />
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
          <h1 className="text-2xl font-bold text-gray-900">Gradebook Management</h1>
          <p className="text-gray-600 mt-1">
            View and analyze student grades across all subjects and classes
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Grades</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalGrades || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.averageGrade ? statistics.averageGrade.toFixed(1) : "0.0"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Grade</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.highestGrade || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passing Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.passingRate ? `${statistics.passingRate.toFixed(1)}%` : "0%"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}


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
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year} {year.status === "ACTIVE" && "(Active)"}
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
              <option value="">All Classes</option>
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
            <h3 className="text-lg font-medium text-blue-900 mb-2">Select Filters to View Grades</h3>
            <p className="text-blue-700">
              Please select a Branch, Academic Year, Class, and Subject to view the grade calendar.
            </p>
          </div>
        </div>
      )}

      {/* Grade Calendar */}
      {selectedBranch && selectedAcademicYear && selectedClass && selectedSubject && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Grade Calendar</h3>
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
          {students.length > 0 && grades.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Total Students</h4>
                  <p className="text-2xl font-bold text-blue-900">{students.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Total Grades</h4>
                  <p className="text-2xl font-bold text-green-900">{grades.length}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                  <h4 className="text-sm font-medium text-orange-700 mb-1">Class Average</h4>
                  <p className="text-2xl font-bold text-orange-900">{getClassAverage()}%</p>
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
                    {grades.length > 0 ? `${grades[0].teacher.firstName} ${grades[0].teacher.lastName}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grade Calendar Grid - EXACT COPY FROM TEACHER GRADEBOOK */}
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
                          <div className="font-bold text-gray-900">{student.lastName}, {student.firstName}</div>
                        </td>
                        {monthDays.map(day => {
                          const grades = getGradesForStudentAndDate(student.id, day);
                          return (
                            <td 
                              key={day.toISOString()} 
                              className="px-2 sm:px-3 py-3 sm:py-4 text-center min-w-[50px] sm:min-w-[60px]"
                            >
                              {grades.length > 0 ? (
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 transform border ${getGradeCellColor(grades[0].value)}`}>
                                  <span className={`font-bold text-sm ${getGradeTextColor(grades[0].value)}`}>{grades[0].value}%</span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 transform bg-gray-100 border border-gray-200">
                                  <span className="text-gray-500 font-medium text-sm">-</span>
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
          ) : (
            <div className="p-6 text-center text-gray-500">
              {!selectedClass || !selectedSubject ? (
                "Please select both a class and subject to view the grade calendar."
              ) : (
                "No students found for the selected class."
              )}
            </div>
          )}

          {/* Legend - EXACT colors from image */}
          {students.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded text-white text-xs font-bold flex items-center justify-center">95</div>
                  <span className="text-gray-600">90-100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs font-bold flex items-center justify-center">85</div>
                  <span className="text-gray-600">80-89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-teal-500 rounded text-white text-xs font-bold flex items-center justify-center">75</div>
                  <span className="text-gray-600">70-79%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs font-bold flex items-center justify-center">65</div>
                  <span className="text-gray-600">60-69%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded text-white text-xs font-bold flex items-center justify-center">50</div>
                  <span className="text-gray-600">40-59%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-700 rounded text-white text-xs font-bold flex items-center justify-center">35</div>
                  <span className="text-gray-600">Below 40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-400 rounded text-white text-xs font-bold flex items-center justify-center">-</div>
                  <span className="text-gray-600">No Grade</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
