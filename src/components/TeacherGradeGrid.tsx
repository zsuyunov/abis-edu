"use client";

import React, { useState, useEffect } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, BookOpen, GraduationCap, X, Clock, MessageSquare, Edit3, BarChart3 } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface GradeRecord {
  id: string;
  date: string;
  value: number;
  description?: string;
  studentId: string;
  lessonNumber?: number;
  student?: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
  timetable?: {
    id: number;
    startTime: string;
    endTime: string;
    subject: {
      name: string;
    };
  };
}

interface TeacherClass {
  id: number;
  name: string;
}

interface TeacherSubject {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface TeacherGradeGridProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
  refreshTrigger?: number;
  teacherId: string;
}

const TeacherGradeGrid: React.FC<TeacherGradeGridProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches,
  refreshTrigger,
  teacherId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeData, setGradeData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeRecord | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editValue, setEditValue] = useState<number>(0);
  const [editDescription, setEditDescription] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCellForNewGrade, setSelectedCellForNewGrade] = useState<{student: Student, date: Date} | null>(null);
  const [currentEditLessonNumber, setCurrentEditLessonNumber] = useState<1 | 2>(1);
  const [showPutGradesModal, setShowPutGradesModal] = useState(false);
  
  // Grades functionality state
  const [showLessonSelectionModal, setShowLessonSelectionModal] = useState(false);
  const [showGradesFormModal, setShowGradesFormModal] = useState(false);
  const [selectedLessonBranch, setSelectedLessonBranch] = useState<string>('');
  const [selectedLessonClass, setSelectedLessonClass] = useState<string>('');
  const [selectedLessonSubject, setSelectedLessonSubject] = useState<string>('');
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonStudents, setLessonStudents] = useState<Student[]>([]);
  const [lessonGradeData, setLessonGradeData] = useState<Record<string, number>>({});
  const [lessonGradeComments, setLessonGradeComments] = useState<Record<string, string>>({});
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isLoadingLessonStudents, setIsLoadingLessonStudents] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lesson 1/2 swap states
  const [currentLessonForm, setCurrentLessonForm] = useState<1 | 2>(1);
  const [showingLesson, setShowingLesson] = useState<1 | 2>(1);
  const [isSwapping, setIsSwapping] = useState(false);
  
  // Track if lesson 2 data exists
  const hasLesson2Data = gradeData.some(r => r.lessonNumber === 2);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await csrfFetch(`/api/students/by-class?classId=${selectedClass}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Grades functionality functions
  const fetchAvailableLessons = async () => {
    if (!selectedLessonBranch || !selectedLessonClass || !selectedLessonSubject) return;

    setIsLoadingLessons(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await csrfFetch(`/api/teacher-timetables?date=${today}&classId=${selectedLessonClass}&subjectId=${selectedLessonSubject}&branchId=${selectedLessonBranch}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const lessons = data.timetables || [];
        console.log('Fetched lessons for grades:', lessons);
        setAvailableLessons(lessons);

        // If there's only one lesson, auto-select it
        if (lessons.length === 1) {
          setSelectedLesson(lessons[0]);
          fetchLessonStudents(lessons[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching available lessons for grades:', error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const fetchLessonStudents = async (lesson?: any) => {
    const targetLesson = lesson || selectedLesson;
    if (!targetLesson) return;

    setIsLoadingLessonStudents(true);
    try {
      const subjectId = targetLesson.subjects?.[0]?.id || targetLesson.subject?.id || selectedLessonSubject;
      const classId = targetLesson.class?.id || selectedLessonClass;

      const response = await csrfFetch(`/api/students?classId=${classId}&subjectId=${subjectId}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const studentList = data.students || [];
        setLessonStudents(studentList);

        // Initialize grade data for all students
        const initialGrades: Record<string, number> = {};
        const initialComments: Record<string, string> = {};

        studentList.forEach((student: Student) => {
          initialGrades[student.id] = 0;
          initialComments[student.id] = '';
        });

        setLessonGradeData(initialGrades);
        setLessonGradeComments(initialComments);
      }
    } catch (error) {
      console.error('Error fetching lesson students for grades:', error);
    } finally {
      setIsLoadingLessonStudents(false);
    }
  };

  const handleLessonGradeChange = (studentId: string, points: number) => {
    setLessonGradeData(prev => ({
      ...prev,
      [studentId]: points
    }));
  };

  const handleLessonCommentChange = (studentId: string, comment: string) => {
    setLessonGradeComments(prev => ({
      ...prev,
      [studentId]: comment
    }));
  };

  const handleSaveLessonGrades = async () => {
    if (!selectedLesson || lessonStudents.length === 0) return;

    setIsSavingGrades(true);
    try {
      const subjectId = selectedLesson.subjects?.[0]?.id || selectedLesson.subject?.id || selectedLessonSubject;
      const classId = selectedLesson.class?.id || selectedLessonClass;
      const branchId = selectedLesson.branch?.id || selectedLesson.class?.branch?.id || selectedLessonBranch;
      
      const gradeRecords = lessonStudents.map(student => ({
        studentId: student.id,
        points: lessonGradeData[student.id] || 0,
        comments: lessonGradeComments[student.id] || '',
      }));

      const response = await csrfFetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          timetableId: selectedLesson.id,
          classId: classId,
          subjectId: subjectId,
          date: new Date().toISOString().split('T')[0],
          lessonNumber: 1,
          grades: gradeRecords,
        }),
      });

      if (response.ok) {
        // Show success message
        alert('✅ Grades saved successfully!');
        
        // Close modal and reset state
        setShowGradesFormModal(false);
        setShowLessonSelectionModal(false);
        setSelectedLessonBranch('');
        setSelectedLessonClass('');
        setSelectedLessonSubject('');
        setAvailableLessons([]);
        setSelectedLesson(null);
        setLessonStudents([]);
        setLessonGradeData({});
        setLessonGradeComments({});
        setSearchTerm('');

        // Refresh main grade data
        fetchGradeData();
      } else {
        const errorData = await response.json();
        console.error('Failed to save grades:', errorData);
        alert(`❌ Failed to save grades: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('❌ Network error occurred while saving grades. Please try again.');
    } finally {
      setIsSavingGrades(false);
    }
  };

  const fetchGradeData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass.toString(),
        subjectId: selectedSubject.toString(),
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear }),
        ...(selectedBranch && { branchId: selectedBranch })
      });

      const response = await csrfFetch(`/api/grades?${params}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Grades API Response:', result);
        const gradeRecords = result.grades || result.data?.grades || result.data || result;
        setGradeData(Array.isArray(gradeRecords) ? gradeRecords : []);
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    fetchGradeData();
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedBranch, currentDate, refreshTrigger]);

  // Auto-swap between lesson 1 and 2 every 3 seconds ONLY if at least one student has both lessons
  useEffect(() => {
    // Always reset animation state first
    setIsSwapping(false);
    setShowingLesson(1);
    
    // Ensure gradeData is valid
    if (!gradeData || !Array.isArray(gradeData) || gradeData.length === 0) {
      return; // No data, no animation
    }
    
    // Check if ANY student has BOTH lesson 1 and lesson 2 records
    const anyStudentHasBothLessons = gradeData.some(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      const recordsForDate = gradeData.filter(r => 
        r.studentId === record.studentId && 
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

    return () => {
      clearInterval(timer);
    };
  }, [gradeData]);

  const getGradesForStudentAndDate = (studentId: string, date: Date) => {
    if (!Array.isArray(gradeData)) return [];
    return gradeData.filter(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getGradeForStudentAndDate = (studentId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Find all records for this student on this date
    const studentRecordsForDate = gradeData.filter(r => 
      r.studentId === studentId && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateStr
    );
    
    if (studentRecordsForDate.length === 0) {
      return undefined; // No grade records
    }
    
    // Check if student has both lessons
    const hasLesson1 = studentRecordsForDate.some(r => r.lessonNumber === 1 || !r.lessonNumber);
    const hasLesson2 = studentRecordsForDate.some(r => r.lessonNumber === 2);
    
    if (hasLesson1 && hasLesson2) {
      // Student has BOTH lessons - show based on current swapping state
      const lesson = showingLesson;
      const record = studentRecordsForDate.find(r => 
        (lesson === 1 && (r.lessonNumber === 1 || !r.lessonNumber)) ||
        (lesson === 2 && r.lessonNumber === 2)
      );
      return record;
    } else {
      // Student has only ONE lesson - always return the same record regardless of showingLesson
      // This prevents re-renders when showingLesson changes
      return studentRecordsForDate[0];
    }
  };

  // Check if a specific STUDENT has BOTH lesson 1 AND lesson 2 for a specific date
  const studentHasBothLessons = (studentId: string, date: Date): boolean => {
    if (!Array.isArray(gradeData)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Find all records for this student on this date
    const studentRecords = gradeData.filter(r => 
      r.studentId === studentId && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateStr
    );
    
    // Check if there's at least one lesson 1 record AND one lesson 2 record
    const hasLesson1 = studentRecords.some(r => r.lessonNumber === 1 || !r.lessonNumber);
    const hasLesson2 = studentRecords.some(r => r.lessonNumber === 2);
    
    return hasLesson1 && hasLesson2;
  };

  const getGradeColor = (value: number | undefined) => {
    if (value === undefined) return 'bg-gray-50 border-gray-200';
    if (value >= 90) return 'bg-green-100 border-green-300 text-green-800';
    if (value >= 80) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (value >= 70) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (value >= 60) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  const getAverageGrade = (grades: GradeRecord[]) => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
    return Math.round(sum / grades.length);
  };

  const getStudentAverage = (studentId: string) => {
    const studentGrades = gradeData.filter(grade => grade.studentId === studentId);
    return getAverageGrade(studentGrades);
  };

  const getClassAverage = () => {
    if (gradeData.length === 0) return 0;
    const sum = gradeData.reduce((acc, grade) => acc + grade.value, 0);
    return Math.round(sum / gradeData.length);
  };

  const handleGradeClick = (grade: GradeRecord) => {
    setSelectedGrade(grade);
    setEditValue(grade.value);
    setEditDescription(grade.description || '');
    setCurrentEditLessonNumber((grade.lessonNumber as 1 | 2) || 1);
    setSelectedCellForNewGrade(null);
    setShowGradeModal(true);
  };

  const handleEmptyCellClick = (student: Student, date: Date) => {
    setSelectedGrade(null);
    setEditValue(0);
    setEditDescription('');
    setCurrentEditLessonNumber(1);
    setSelectedCellForNewGrade({ student, date });
    setShowGradeModal(true);
  };

  const handleUpdateGrade = async () => {
    if (editValue < 1 || editValue > 100) return;

    setIsUpdating(true);
    try {
      if (selectedGrade) {
        // Update existing grade
        const response = await csrfFetch('/api/grades', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('userId') || ''
          },
          body: JSON.stringify({
            gradeId: selectedGrade.id,
            value: editValue,
            description: editDescription
          })
        });

        if (response.ok) {
          setGradeData(prev => prev.map(grade => 
            grade.id === selectedGrade.id 
              ? { ...grade, value: editValue, description: editDescription }
              : grade
          ));
          setShowGradeModal(false);
          alert('✅ Grade updated successfully!');
          fetchGradeData();
        } else {
          const errorData = await response.json();
          alert(`Failed to update grade: ${errorData.error || 'Unknown error'}`);
        }
      } else if (selectedCellForNewGrade) {
        // Create new grade
        const response = await csrfFetch('/api/grades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': teacherId
          },
          body: JSON.stringify({
            studentId: selectedCellForNewGrade.student.id,
            classId: selectedClass,
            subjectId: selectedSubject,
            date: format(selectedCellForNewGrade.date, 'yyyy-MM-dd'),
            value: editValue,
            description: editDescription,
            lessonNumber: currentEditLessonNumber
          })
        });

        if (response.ok) {
          setShowGradeModal(false);
          alert('✅ Grade created successfully!');
          fetchGradeData();
        } else {
          const errorData = await response.json();
          alert(`Failed to create grade: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle DateTime @db.Time format from Prisma
      if (!timeString) return 'No time';
      
      let date: Date;
      
      if (typeof timeString === 'string' && timeString.includes(':')) {
        // If it's already a time string like "08:30:00"
        const [hours, minutes] = timeString.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          // Create a date with UTC time to avoid timezone issues
          date = new Date(`1970-01-01T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00Z`);
        } else {
          date = new Date(timeString);
        }
      } else {
        // If it's a Date object or ISO string
        date = new Date(timeString);
      }
      
      if (isNaN(date.getTime())) {
        return timeString; // Return original if all else fails
      }
      
      // Use UTC methods to avoid timezone conversion issues
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error, 'Input:', timeString);
      return timeString;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            📊 Grade Tracking
          </h2>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Class</option>
                {teacherClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {teacherSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Put Grades Button */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Input grades for a specific lesson</p>
            </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLessonSelectionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-sm"
                >
                  <BarChart3 size={16} />
                  Put Grades
                </motion.button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Statistics */}
        {selectedClass && selectedSubject && gradeData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">Total Grades</h4>
              <p className="text-2xl font-bold text-blue-900">{gradeData.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">Class Average</h4>
              <p className="text-2xl font-bold text-green-900">{getAverageGrade(gradeData)}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-700">Highest Grade</h4>
              <p className="text-2xl font-bold text-yellow-900">
                {gradeData.length > 0 ? Math.max(...gradeData.map(g => g.value)) : 0}%
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">Lowest Grade</h4>
              <p className="text-2xl font-bold text-red-900">
                {gradeData.length > 0 ? Math.min(...gradeData.map(g => g.value)) : 0}%
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedClass && selectedSubject ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[140px] sm:min-w-[200px]">
                    Student
                  </th>
                  <th className="sticky left-[140px] sm:left-[200px] z-10 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[60px] sm:min-w-[80px]">
                    Average
                  </th>
                  {monthDays.map(day => (
                    <th key={day.toISOString()} className="px-1 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[40px] sm:min-w-[60px]">
                      <div className="text-xs sm:text-sm">{format(day, 'dd')}</div>
                      <div className="text-xs text-gray-400 hidden sm:block">{format(day, 'EEE')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => {
                  const studentAvg = getStudentAverage(student.id);
                  return (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="sticky left-0 z-10 bg-inherit px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[140px] sm:min-w-[200px]">
                        <div className="truncate font-medium">{student.firstName} {student.lastName}</div>
                        <div className="truncate text-xs text-gray-500 mt-1">{student.studentId}</div>
                      </td>
                      <td className={`sticky left-[140px] sm:left-[200px] z-10 bg-inherit px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-center border-r border-gray-200 min-w-[60px] sm:min-w-[80px] ${getGradeColor(studentAvg > 0 ? studentAvg : undefined)}`}>
                        {studentAvg > 0 ? `${studentAvg}%` : '-'}
                      </td>
                      {monthDays.map(day => {
                        const grade = getGradeForStudentAndDate(student.id, day);
                        const hasBothLessons = studentHasBothLessons(student.id, day);
                        
                        return (
                          <td 
                            key={day.toISOString()} 
                            className="px-1 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium border-r border-gray-200 min-w-[40px] sm:min-w-[60px]"
                          >
                            {grade ? (
                              <div className="relative inline-block" key={`${student.id}-${format(day, 'yyyy-MM-dd')}`}>
                                {hasBothLessons ? (
                                  // BOTH lessons exist - apply swap animation with motion.div
                                  <>
                                    <motion.div
                                      className={`px-1 sm:px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getGradeColor(grade.value)}`}
                                      onClick={() => handleGradeClick(grade)}
                                      title={`Click to edit grade${grade.timetable ? ` (${grade.timetable.startTime} - ${grade.timetable.endTime})` : ''}`}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <AnimatePresence mode="wait">
                                        <motion.span
                                          key={grade.value}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          transition={{
                                            duration: 0.2,
                                            ease: "easeInOut"
                                          }}
                                        >
                                          {grade.value}%
                                        </motion.span>
                                      </AnimatePresence>
                                    </motion.div>
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
                                        className="absolute -top-1 -right-1 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg"
                                      >
                                        L{showingLesson}
                                      </motion.span>
                                    </AnimatePresence>
                                  </>
                                ) : (
                                  // ONLY one lesson - display statically without animation or motion components
                                  <div
                                    className={`px-1 sm:px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getGradeColor(grade.value)}`}
                                    onClick={() => handleGradeClick(grade)}
                                    title={`Click to edit grade${grade.timetable ? ` (${grade.timetable.startTime} - ${grade.timetable.endTime})` : ''}`}
                                  >
                                    <span>{grade.value}%</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div 
                                className="text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded p-1 transition-colors"
                                onClick={() => handleEmptyCellClick(student, day)}
                                title="Click to add grade"
                              >
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select both a class and subject to view grade history.
        </div>
      )}

      {/* Legend */}
      {selectedClass && selectedSubject && (
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>90-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>80-89%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>70-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span>60-69%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Below 60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>No Grade</span>
          </div>
        </div>
      )}

      {/* Grade Edit/Create Modal */}
      {showGradeModal && (selectedGrade || selectedCellForNewGrade) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                {selectedGrade ? 'Edit Grade' : 'Mark Grade'}
              </h3>
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedGrade(null);
                  setSelectedCellForNewGrade(null);
                  setCurrentEditLessonNumber(1);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">
                {selectedGrade ? 
                  `${selectedGrade.student?.firstName} ${selectedGrade.student?.lastName}` :
                  `${selectedCellForNewGrade?.student.firstName} ${selectedCellForNewGrade?.student.lastName}`
                }
              </div>
              <div className="text-sm text-gray-500">
                ID: {selectedGrade ? 
                  selectedGrade.student?.studentId : 
                  selectedCellForNewGrade?.student.studentId
                }
              </div>
              <div className="text-sm text-gray-500">
                Date: {selectedGrade ? 
                  format(new Date(selectedGrade.date), 'MMM dd, yyyy') :
                  format(selectedCellForNewGrade?.date || new Date(), 'MMM dd, yyyy')
                }
              </div>
            </div>

            {/* Lesson Time Info */}
            {selectedGrade?.timetable && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                  <Clock className="w-4 h-4" />
                  Lesson Time
                </div>
                <div className="text-sm text-blue-700">
                  {formatTime(selectedGrade.timetable.startTime)} - {formatTime(selectedGrade.timetable.endTime)}
                </div>
                <div className="text-sm text-blue-600">
                  Subject: {selectedGrade.timetable.subject?.name}
                </div>
              </div>
            )}

            {/* Grade Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter grade (1-100)"
              />
            </div>

            {/* Comments Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Comments
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter comments about this grade..."
              />
            </div>

            {/* Lesson Navigation - Always show for create/edit */}
            <div className="mb-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Lesson
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedGrade) {
                      // Can't change lesson for existing grades
                      return;
                    }
                    setCurrentEditLessonNumber(1);
                  }}
                  disabled={selectedGrade !== null}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    (selectedGrade ? selectedGrade.lessonNumber === 1 || !selectedGrade.lessonNumber : currentEditLessonNumber === 1)
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${selectedGrade ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  📘 Lesson 1
                </button>
                <button
                  onClick={() => {
                    if (selectedGrade) {
                      // Can't change lesson for existing grades
                      return;
                    }
                    setCurrentEditLessonNumber(2);
                  }}
                  disabled={selectedGrade !== null}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    (selectedGrade ? selectedGrade.lessonNumber === 2 : currentEditLessonNumber === 2)
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${selectedGrade ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  📗 Lesson 2
                </button>
              </div>
              {selectedGrade && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  ℹ️ Cannot change lesson for existing grades
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedGrade(null);
                  setSelectedCellForNewGrade(null);
                  setCurrentEditLessonNumber(1);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGrade}
                disabled={isUpdating || editValue < 1 || editValue > 100}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? (selectedGrade ? 'Updating...' : 'Adding...') : (selectedGrade ? 'Update Grade' : 'Add Grade')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Selection Modal */}
      <AnimatePresence>
        {showLessonSelectionModal && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Select Lesson for Grades</h3>
                <button
                  onClick={() => setShowLessonSelectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Lesson Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Branch
                    </label>
                    <select
                      value={selectedLessonBranch}
                      onChange={(e) => {
                        setSelectedLessonBranch(e.target.value);
                        setAvailableLessons([]);
                        setSelectedLesson(null);
                        setLessonStudents([]);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Class
                    </label>
                    <select
                      value={selectedLessonClass}
                      onChange={(e) => {
                        setSelectedLessonClass(e.target.value);
                        setAvailableLessons([]);
                        setSelectedLesson(null);
                        setLessonStudents([]);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {teacherClasses.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <BookOpen className="w-4 h-4 inline mr-1" />
                      Subject
                    </label>
                    <select
                      value={selectedLessonSubject}
                      onChange={(e) => {
                        setSelectedLessonSubject(e.target.value);
                        setAvailableLessons([]);
                        setSelectedLesson(null);
                        setLessonStudents([]);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {teacherSubjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Load Lessons Button */}
                {selectedLessonBranch && selectedLessonClass && selectedLessonSubject && (
                  <div className="text-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchAvailableLessons}
                      disabled={isLoadingLessons}
                      className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoadingLessons ? 'Loading Lessons...' : 'Load Today\'s Lessons'}
                    </motion.button>
                  </div>
                )}

                {/* Available Lessons */}
                {availableLessons.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Available Lessons for Today</h4>
                    <div className="space-y-2">
                      {availableLessons.map((lesson, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setShowLessonSelectionModal(false);
                            setShowGradesFormModal(true);
                            fetchLessonStudents(lesson);
                          }}
                          className="p-4 border rounded-xl cursor-pointer transition-colors hover:border-purple-300 hover:bg-purple-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {lesson.class?.name || 'Unknown Class'} • {lesson.subjects?.[0]?.name || lesson.subject?.name || 'Unknown Subject'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {lesson.branch?.shortName || lesson.class?.branch?.shortName || 'Unknown Branch'}{lesson.roomNumber || lesson.buildingName ? ` • ${lesson.roomNumber || lesson.buildingName}` : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {lesson.startTime} - {lesson.endTime}
                              </div>
                              <div className="text-sm text-gray-600">
                                Lesson {lesson.lessonNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowLessonSelectionModal(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grades Form Modal */}
      <AnimatePresence>
        {showGradesFormModal && selectedLesson && (
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Put Grades</h3>
                </div>
                <button
                  onClick={() => {
                    setShowGradesFormModal(false);
                    setSelectedLesson(null);
                    setLessonStudents([]);
                    setLessonGradeData({});
                    setLessonGradeComments({});
                    setSearchTerm('');
                    setCurrentLessonForm(1);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">
                    {selectedLesson.class?.name || 'Unknown Class'} • {selectedLesson.subjects?.[0]?.name || selectedLesson.subject?.name || 'Unknown Subject'}
                  </h4>
                  <p className="text-sm text-purple-700">
                    {selectedLesson.branch?.shortName || selectedLesson.class?.branch?.shortName || 'Unknown Branch'}{selectedLesson.roomNumber || selectedLesson.buildingName ? ` • ${selectedLesson.roomNumber || selectedLesson.buildingName}` : ''} • {selectedLesson.startTime} - {selectedLesson.endTime}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Student Grades</h4>
                  {isLoadingLessonStudents ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                    </div>
                  ) : lessonStudents.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {lessonStudents
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
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-purple-700">
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
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Grade"
                              value={lessonGradeData[student.id] || ''}
                              onChange={(e) => handleLessonGradeChange(student.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">Comment (optional)</label>
                            <textarea
                              placeholder="Add a comment about this student's grade..."
                              value={lessonGradeComments[student.id] || ''}
                              onChange={(e) => handleLessonCommentChange(student.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
                      setShowGradesFormModal(false);
                      setSelectedLesson(null);
                      setLessonStudents([]);
                      setLessonGradeData({});
                      setLessonGradeComments({});
                      setSearchTerm('');
                      setCurrentLessonForm(1);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLessonGrades}
                    disabled={isSavingGrades || lessonStudents.length === 0}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingGrades ? 'Saving...' : 'Save Grades'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherGradeGrid;
