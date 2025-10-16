"use client";

import React, { useState, useEffect } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, BookOpen, Calendar, Check, X, Clock, Shield, Edit3, MessageSquare } from 'lucide-react';

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
}

interface TeacherClass {
  id: number;
  name: string;
}

interface TeacherSubject {
  id: number;
  name: string;
}


interface TeacherGradebookGridProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  teacherId: string;
  refreshTrigger?: number;
}

const TeacherGradebookGrid: React.FC<TeacherGradebookGridProps> = ({
  teacherClasses,
  teacherSubjects,
  teacherId,
  refreshTrigger
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeData, setGradeData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ student: Student; date: Date } | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<number>(0);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [customGradeInput, setCustomGradeInput] = useState<string>('');
  const [currentLessonForm, setCurrentLessonForm] = useState<1 | 2>(1);
  const [showingLesson, setShowingLesson] = useState<1 | 2>(1);
  const [isSwapping, setIsSwapping] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Check if lesson 2 exists for swap animation
  const hasLesson2 = () => {
    if (!Array.isArray(gradeData) || gradeData.length === 0) return false;
    return gradeData.some(r => r.lessonNumber === 2);
  };

  // Auto-swap between lesson 1 and 2 every 3 seconds ONLY if at least one student has both lessons
  useEffect(() => {
    setIsSwapping(false);
    setShowingLesson(1);
    
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

    return () => clearInterval(timer);
  }, [gradeData]);

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

  const fetchGradeData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass.toString(),
        subjectId: selectedSubject.toString(),
        month: format(currentDate, 'yyyy-MM')
      });

      const response = await csrfFetch(`/api/grades?${params}`);
      if (response.ok) {
        const result = await response.json();
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
  }, [selectedClass, selectedSubject, currentDate, refreshTrigger]);


  const getGradeForStudentAndDate = (studentId: string, date: Date, lessonNum: number = 1) => {
    // Check existing grade for specific lesson
    const existing = gradeData.find(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      (record.lessonNumber === lessonNum || (!record.lessonNumber && lessonNum === 1))
    );
    
    return existing ? existing.value : null;
  };

  // Get grade to display based on showing lesson (for swap animation)
  const getDisplayGrade = (studentId: string, date: Date) => {
    // Only use swap animation if this specific student has both lessons on this date
    const hasBothLessonsForThisStudent = studentHasBothLessons(studentId, date);
    const lessonToShow = hasBothLessonsForThisStudent ? showingLesson : 1;
    return getGradeForStudentAndDate(studentId, date, lessonToShow);
  };

  // Check if student has both lessons on a date
  const studentHasBothLessons = (studentId: string, date: Date): boolean => {
    if (!Array.isArray(gradeData)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const studentRecords = gradeData.filter(r => 
      r.studentId === studentId && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateStr
    );
    
    const hasLesson1 = studentRecords.some(r => r.lessonNumber === 1 || !r.lessonNumber);
    const hasLesson2Records = studentRecords.some(r => r.lessonNumber === 2);
    
    return hasLesson1 && hasLesson2Records;
  };

  const getGradeColor = (value: number | null | string) => {
    if (value === null || value === 'NO_RECORD') return 'bg-[#D1D5DB] hover:bg-[#9CA3AF] shadow-sm hover:shadow-md'; // Light Gray (No Grade/No Record)
    if (typeof value === 'string') return 'bg-[#D1D5DB] hover:bg-[#9CA3AF] shadow-sm hover:shadow-md'; // Handle any string values
    if (value >= 90) return 'bg-[#22C55E] hover:bg-[#16A34A] shadow-sm hover:shadow-md'; // Green (Excellent)
    if (value >= 80) return 'bg-[#3B82F6] hover:bg-[#2563EB] shadow-sm hover:shadow-md'; // Blue (Very Good)
    if (value >= 70) return 'bg-[#06B6D4] hover:bg-[#0891B2] shadow-sm hover:shadow-md'; // Teal/Cyan (Good)
    if (value >= 60) return 'bg-[#F59E0B] hover:bg-[#D97706] shadow-sm hover:shadow-md'; // Amber/Orange (Average)
    if (value >= 40) return 'bg-[#EF4444] hover:bg-[#DC2626] shadow-sm hover:shadow-md'; // Red (Poor)
    return 'bg-[#991B1B] hover:bg-[#7F1D1D] shadow-sm hover:shadow-md'; // Dark Red (Fail)
  };

  const getGradeIcon = (value: number | null | string) => {
    if (value === null || value === 'NO_RECORD') return <span className="text-gray-500 text-sm font-medium">–</span>;
    if (typeof value === 'string') return <span className="text-gray-500 text-sm font-medium">–</span>; // Handle any string values
    return <span className="text-white text-sm font-bold">{value}</span>;
  };

  const handleCellClick = (student: Student, date: Date) => {
    setSelectedCell({ student, date });
    loadGradeForCurrentLesson(student, date, currentLessonForm);
    setShowGradeModal(true);
  };

  // Load grade data for specific lesson
  const loadGradeForCurrentLesson = (student: Student, date: Date, lessonNum: 1 | 2) => {
    // Check if there's existing grade data for this student, date, and lesson
    const existingGrade = getGradeForStudentAndDate(student.id, date, lessonNum);
    
    // Find the existing grade record to get the comment
    const existingGradeRecord = gradeData.find(record => 
      record.studentId === student.id && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      (record.lessonNumber === lessonNum || (!record.lessonNumber && lessonNum === 1))
    );
    
    // Set the current grade and comment
    if (existingGrade !== null && typeof existingGrade === 'number') {
      setCurrentGrade(existingGrade);
      setCurrentComment(existingGradeRecord?.description || '');
      setCustomGradeInput(existingGrade.toString());
    } else {
      setCurrentGrade(0);
      setCurrentComment('');
      setCustomGradeInput('');
    }
  };

  // Update grade when lesson form changes
  useEffect(() => {
    if (selectedCell && showGradeModal) {
      loadGradeForCurrentLesson(selectedCell.student, selectedCell.date, currentLessonForm);
    }
  }, [currentLessonForm]);


  const handleGradeSubmit = async () => {
    if (!selectedCell) return;

    const gradeValue = parseInt(customGradeInput);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      alert('Please enter a valid grade between 0 and 100');
      return;
    }

    const { student, date } = selectedCell;
    const dateString = format(date, 'yyyy-MM-dd');
    
    try {
      // Save grade immediately
      const response = await csrfFetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          studentId: student.id,
          classId: selectedClass,
          subjectId: selectedSubject,
          date: dateString,
          value: gradeValue,
          description: currentComment,
          lessonNumber: currentLessonForm
        })
      });

      if (response.ok) {
        console.log(`✅ Grade saved for student ${student.id}`);
        // Refresh data immediately
        fetchGradeData();
      } else {
        console.error('Failed to save grade:', await response.json());
      }
    } catch (error) {
      console.error('Error saving grade:', error);
    }

    setShowGradeModal(false);
    setSelectedCell(null);
    setCurrentGrade(0);
    setCurrentComment('');
    setCustomGradeInput('');
    setCurrentLessonForm(1);
  };

  const handleNoRecord = async () => {
    if (!selectedCell) return;

    const { student, date } = selectedCell;
    const dateString = format(date, 'yyyy-MM-dd');
    
    try {
      // Delete grade immediately
      const response = await csrfFetch('/api/grades', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          studentId: student.id,
          classId: selectedClass,
          subjectId: selectedSubject,
          date: dateString,
          lessonNumber: currentLessonForm
        })
      });

      if (response.ok) {
        console.log(`✅ Grade deleted for student ${student.id}`);
        // Refresh data immediately
        fetchGradeData();
      } else {
        console.error('Failed to delete grade:', await response.json());
      }
    } catch (error) {
      console.error('Error deleting grade:', error);
    }

    setShowGradeModal(false);
    setSelectedCell(null);
    setCurrentGrade(0);
    setCurrentComment('');
    setCustomGradeInput('');
    setCurrentLessonForm(1);
  };


  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-full mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gradebook</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage student grades</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Users className="w-5 h-5 inline mr-2" />
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Class</option>
                {teacherClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <BookOpen className="w-5 h-5 inline mr-2" />
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Select Subject</option>
                {teacherSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth('prev')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Pending Grades */}

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 font-medium">Loading grade data...</p>
                </div>
              </div>
            </div>
          ) : selectedClass && selectedSubject ? (
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
                          const hasBothLessons = studentHasBothLessons(student.id, day);
                          const grade = getDisplayGrade(student.id, day);
                          return (
                            <td 
                              key={day.toISOString()} 
                              className="px-2 sm:px-3 py-3 sm:py-4 text-center min-w-[50px] sm:min-w-[60px]"
                            >
                              <div className="relative">
                                <motion.button
                                  onClick={() => handleCellClick(student, day)}
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${getGradeColor(grade)}`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <AnimatePresence mode="wait">
                                    <motion.div
                                      key={grade}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{
                                        duration: 0.2,
                                        ease: "easeInOut"
                                      }}
                                    >
                                      {getGradeIcon(grade)}
                                    </motion.div>
                                  </AnimatePresence>
                                </motion.button>
                                {hasBothLessons && (
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

              {/* Legend */}
              <div className="p-4 sm:p-8 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#22C55E] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs sm:text-sm font-bold">95</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">90-100%</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs sm:text-sm font-bold">85</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">80-89%</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#06B6D4] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs sm:text-sm font-bold">75</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">70-79%</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#F59E0B] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs sm:text-sm font-bold">65</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">60-69%</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#EF4444] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs sm:text-sm font-bold">50</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">40-59%</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#991B1B] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs sm:text-sm font-bold">35</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">Below 40%</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#D1D5DB] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-gray-500 text-xs sm:text-sm font-medium">–</span>
                    </div>
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm">No Grade</span>
                  </div>
                </div>
                <div className="text-center text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 font-medium">
                  Click on any cell to mark grade
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Class and Subject</h3>
                <p className="text-gray-600">Please select a class and subject to view the gradebook</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Grade Modal */}
        {showGradeModal && selectedCell && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-sm shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Mark Grade</h3>
                  <span className="text-xs font-semibold text-blue-600">Lesson {currentLessonForm}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleNoRecord}
                    className="px-2 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-200 font-medium text-xs"
                  >
                    No Record
                  </button>
                  <button
                    onClick={() => setShowGradeModal(false)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <div className="font-bold text-gray-900 text-sm sm:text-base">
                  {selectedCell.student.lastName}, {selectedCell.student.firstName}
                </div>
                <div className="text-gray-600 text-xs">
                  {format(selectedCell.date, 'MMMM dd, yyyy')}
                </div>
              </div>

              {/* Comment Field */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <label className="text-sm sm:text-base font-semibold text-gray-700">Comment (optional)</label>
                <textarea
                  placeholder="Add a comment about this student's grade..."
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                  rows={2}
                />
                <p className="text-xs text-gray-500 italic">
                  💡 Tip: Add a comment first if you need to provide additional details about this student's grade.
                </p>
              </div>

              {/* Grade Input */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <label className="text-sm sm:text-base font-semibold text-gray-700">Grade (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customGradeInput}
                  onChange={(e) => setCustomGradeInput(e.target.value)}
                  placeholder="Enter grade (0-100)"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-1.5 sm:gap-2">
                <button
                  onClick={handleNoRecord}
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-xs sm:text-sm"
                >
                  No Record
                </button>
                <button
                  onClick={handleGradeSubmit}
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-xs sm:text-sm"
                >
                  Add Grade
                </button>
              </div>

              {/* Lesson Navigation */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                {currentLessonForm === 2 && (
                  <button
                    onClick={() => setCurrentLessonForm(1)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    ← Back to Lesson 1
                  </button>
                )}
                {currentLessonForm === 1 && (
                  <button
                    onClick={() => setCurrentLessonForm(2)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md"
                  >
                    Extra → Lesson 2
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherGradebookGrid;
