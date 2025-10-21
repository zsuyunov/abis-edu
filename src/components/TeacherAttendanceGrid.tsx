"use client";

import React, { useState, useEffect } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDaysInMonth, getDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, BookOpen, Calendar, Check, X, Clock, Shield } from 'lucide-react';
import { formatDatabaseTime } from '@/lib/utils';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  studentId: string;
  notes?: string;
  lessonNumber?: number;
}

interface TeacherClass {
  id: number;
  name: string;
}

interface TeacherSubject {
  id: number;
  name: string;
}

interface TeacherAttendanceGridProps {
  teacherId: string;
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  refreshTrigger?: number;
}


const TeacherAttendanceGrid: React.FC<TeacherAttendanceGridProps> = ({
  teacherId,
  teacherClasses,
  teacherSubjects,
  refreshTrigger
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{student: Student, date: Date} | null>(null);
  const [currentComment, setCurrentComment] = useState('');
  const [showBulkDateModal, setShowBulkDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [currentLessonForm, setCurrentLessonForm] = useState<1 | 2>(1);
  const [showingLesson, setShowingLesson] = useState<1 | 2>(1);
  const [isSwapping, setIsSwapping] = useState(false);
  
  // Debug: Track if lesson 2 exists
  const hasLesson2Data = attendanceData.some(r => r.lessonNumber === 2);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await csrfFetch(`/api/teacher-students/by-class?classId=${selectedClass}`);
      if (response.ok) {
        const result = await response.json();
        const students = result.success ? result.data : result;
        setStudents(students);
      } else {
        console.error('Failed to fetch students. Status:', response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchAttendanceData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        month: format(currentDate, 'yyyy-MM')
      });

      const response = await csrfFetch(`/api/attendance/history?${params}`);
      if (response.ok) {
        const result = await response.json();
        const attendanceRecords = Array.isArray(result) ? result : [];
        setAttendanceData(attendanceRecords);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedClass, selectedSubject, currentDate, refreshTrigger]);

  const getAttendanceForStudentAndDate = (studentId: string, date: Date, lessonNum: number = 1) => {
    if (!Array.isArray(attendanceData)) return null;
    return attendanceData.find(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
      (record.lessonNumber === lessonNum || (!record.lessonNumber && lessonNum === 1))
    );
  };

  // Check if there are records for lesson 2 in the current month
  const hasLesson2 = () => {
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) return false;
    
    // Explicitly check for lesson 2 records (must have lessonNumber === 2)
    const hasLesson2Records = attendanceData.some(r => r.lessonNumber === 2);
    
    console.log('🔍 Checking lessons:', {
      totalRecords: attendanceData.length,
      hasLesson2Records,
      lessonNumbers: attendanceData.map(r => r.lessonNumber),
      uniqueLessonNumbers: Array.from(new Set(attendanceData.map(r => r.lessonNumber)))
    });
    
    return hasLesson2Records;
  };

  // Auto-swap between lesson 1 and 2 every 3 seconds ONLY if at least one student has both lessons
  useEffect(() => {
    // Always reset animation state first
    setIsSwapping(false);
    setShowingLesson(1);
    
    // Check if ANY student has BOTH lesson 1 and lesson 2 records
    const anyStudentHasBothLessons = attendanceData.some(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      const recordsForDate = attendanceData.filter(r => 
        r.studentId === record.studentId && 
        format(new Date(r.date), 'yyyy-MM-dd') === dateStr
      );
      
      const hasLesson1 = recordsForDate.some(r => r.lessonNumber === 1 || !r.lessonNumber);
      const hasLesson2 = recordsForDate.some(r => r.lessonNumber === 2);
      
      return hasLesson1 && hasLesson2;
    });
    
    console.log('🔍 ANIMATION CHECK:', {
      totalRecords: attendanceData.length,
      anyStudentHasBothLessons,
      lesson2Count: attendanceData.filter(r => r.lessonNumber === 2).length
    });
    
    // If NO student has both lessons, DO NOT start any animation
    if (!anyStudentHasBothLessons) {
      console.log('🚫 NO ANIMATION - No student has both lesson 1 and lesson 2');
      return; // Exit early, no timer created
    }

    // If at least one student has both lessons, start the swap animation
    console.log('🔄 STARTING ANIMATION - At least one student has both lessons');
    const timer = setInterval(() => {
      setShowingLesson(prev => prev === 1 ? 2 : 1);
      setIsSwapping(true);
      setTimeout(() => setIsSwapping(false), 300);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, [attendanceData]);


  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'PRESENT': return <Check className="w-4 h-4 text-white" />;
      case 'ABSENT': return <X className="w-4 h-4 text-white" />;
      case 'LATE': return <Clock className="w-4 h-4 text-white" />;
      case 'EXCUSED': return <Shield className="w-4 h-4 text-white" />;
      default: return <span className="text-gray-500 text-sm font-medium">–</span>;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'PRESENT': return 'bg-[#34C759] hover:bg-[#228B22] shadow-sm hover:shadow-md';
      case 'ABSENT': return 'bg-[#FF3B30] hover:bg-[#B22222] shadow-sm hover:shadow-md';
      case 'LATE': return 'bg-[#FFCC00] hover:bg-[#B8860B] shadow-sm hover:shadow-md';
      case 'EXCUSED': return 'bg-[#007AFF] hover:bg-[#1E3A8A] shadow-sm hover:shadow-md';
      default: return 'bg-[#D1D5DB] hover:bg-[#4B5563] shadow-sm hover:shadow-md';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateHeaderClick = (date: Date) => {
    if (!selectedClass || !selectedSubject) {
      alert('Please select a class and subject first');
      return;
    }
    setSelectedDate(date);
    setShowBulkDateModal(true);
  };

  const handleMarkAllPresent = async () => {
    if (!selectedDate || !selectedClass || !selectedSubject) return;
    
    setIsSavingBulk(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Mark all students as present
      const attendance = students.map(student => ({
        studentId: student.id,
        status: 'PRESENT',
        notes: ''
      }));

      const response = await csrfFetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId
        },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          date: dateString,
          lessonNumber: currentLessonForm,
          attendance
        })
      });

      if (response.ok) {
        console.log('✅ All students marked present successfully');
        await fetchAttendanceData(); // Refresh the grid
        setShowBulkDateModal(false);
        setSelectedDate(null);
      } else {
        const error = await response.json();
        console.error('Failed to mark all present:', error);
        alert('Failed to mark attendance. Please try again.');
      }
    } catch (error) {
      console.error('Error marking all present:', error);
      alert('An error occurred while marking attendance.');
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleCellClick = (student: Student, date: Date) => {
    setSelectedCell({ student, date });
    
    // Check if there's existing attendance data for this student and date
    const existingAttendance = getAttendanceForStudentAndDate(student.id, date);
    
    // Set the current comment to existing comment if available
    if (existingAttendance) {
      setCurrentComment(existingAttendance.notes || '');
    } else {
      setCurrentComment('');
    }
    
    setShowStatusModal(true);
  };

  const handleStatusSelect = async (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NO_RECORD') => {
    if (!selectedCell) return;

    const { student, date } = selectedCell;
    const dateString = format(date, 'yyyy-MM-dd');
    
    try {
      if (status === 'NO_RECORD') {
        // Delete attendance record immediately
        const response = await csrfFetch('/api/attendance', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': teacherId
          },
          body: JSON.stringify({
            studentId: student.id,
            classId: selectedClass,
            subjectId: selectedSubject,
            date: dateString
          })
        });

        if (response.ok) {
          console.log(`✅ Attendance deleted for student ${student.id}`);
          // Refresh data immediately
          fetchAttendanceData();
        } else {
          console.error('Failed to delete attendance:', await response.json());
        }
      } else {
        // Save attendance record immediately
        const response = await csrfFetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': teacherId
          },
          body: JSON.stringify({
            classId: selectedClass,
            subjectId: selectedSubject,
            date: dateString,
            lessonNumber: currentLessonForm,
            attendance: [{
              studentId: student.id,
              status: status,
              notes: currentComment
            }]
          })
        });

        if (response.ok) {
          console.log(`✅ Attendance saved for student ${student.id}`);
          // Refresh data immediately
          fetchAttendanceData();
        } else {
          console.error('Failed to save attendance:', await response.json());
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }

    setShowStatusModal(false);
    setSelectedCell(null);
    setCurrentComment('');
  };


  const getCellStatus = (student: Student, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Find all records for this student on this date
    const studentRecordsForDate = attendanceData.filter(r => 
      r.studentId === student.id && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateStr
    );
    
    if (studentRecordsForDate.length === 0) {
      return null; // No attendance records
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
      return record?.status || null;
    } else {
      // Student has only ONE lesson - show it statically
      return studentRecordsForDate[0]?.status || null;
    }
  };

  const getCurrentStatusForModal = (student: Student, date: Date) => {
    // Check existing attendance for current lesson form
    const existing = getAttendanceForStudentAndDate(student.id, date, currentLessonForm);
    if (existing) {
      return existing.status;
    }

    return null;
  };

  // Check if there are multiple lessons for a given date (both L1 and L2)
  const hasMultipleLessonsOnDate = (date: Date) => {
    if (!Array.isArray(attendanceData)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const lessonsOnDate = new Set(
      attendanceData
        .filter(r => format(new Date(r.date), 'yyyy-MM-dd') === dateStr)
        .map(r => r.lessonNumber || 1)
    );
    return lessonsOnDate.has(1) && lessonsOnDate.has(2);
  };

  // Check if a specific STUDENT has BOTH lesson 1 AND lesson 2 for a specific date
  const studentHasBothLessons = (studentId: string, date: Date): boolean => {
    if (!Array.isArray(attendanceData)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Find all records for this student on this date
    const studentRecords = attendanceData.filter(r => 
      r.studentId === studentId && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateStr
    );
    
    // Check if there's at least one lesson 1 record AND one lesson 2 record
    const hasLesson1 = studentRecords.some(r => r.lessonNumber === 1 || !r.lessonNumber);
    const hasLesson2 = studentRecords.some(r => r.lessonNumber === 2);
    
    return hasLesson1 && hasLesson2;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance</h1>
          <p className="text-gray-600">Track and manage student attendance</p>
          
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Users className="w-4 h-4 inline mr-2" />
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300"
            >
              <option value="">Select Class</option>
              {teacherClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <BookOpen className="w-4 h-4 inline mr-2" />
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
            <button
            onClick={() => navigateMonth('prev')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
            </h2>
          
            <button
            onClick={() => navigateMonth('next')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>


      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 font-medium">Loading attendance data...</p>
            </div>
              </div>
            </div>
        ) : selectedClass && selectedSubject ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="max-h-96 overflow-auto">
                <table className="min-w-full">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr>
                      <th className="sticky left-0 z-20 bg-white px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[220px] border-r border-gray-200">
                        Student Name
                      </th>
                      {monthDays.map(day => (
                        <th key={day.toISOString()} className="px-3 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider min-w-[60px]">
                          <button
                            onClick={() => handleDateHeaderClick(day)}
                            className="w-full hover:bg-blue-50 rounded-lg p-2 transition-colors duration-200 cursor-pointer"
                            title="Click to mark attendance for all students on this date"
                          >
                            <div className="text-base font-bold">{format(day, 'dd')}</div>
                            <div className="text-xs text-gray-500 font-normal">{format(day, 'EEE')}</div>
                          </button>
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
                          <td className="sticky left-0 z-20 bg-white px-8 py-4 text-sm font-semibold text-gray-900 min-w-[220px] border-r border-gray-200">
                            <div className="font-bold text-gray-900">{student.lastName}, {student.firstName}</div>
                          </td>
                          {monthDays.map(day => {
                            // Check if THIS specific student has BOTH lesson 1 AND lesson 2 for THIS date
                            const hasBothLessons = studentHasBothLessons(student.id, day);
                            
                            // Get the status based on whether this student has both lessons
                            const status = getCellStatus(student, day);
                            
                            return (
                              <td 
                                key={day.toISOString()} 
                                className="px-3 py-4 text-center min-w-[60px]"
                              >
                                <div className="relative">
                                  <motion.button
                                    onClick={() => handleCellClick(student, day)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(status || undefined)}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <AnimatePresence mode="wait">
                                      <motion.div
                                        key={status}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{
                                          duration: 0.2,
                                          ease: "easeInOut"
                                        }}
                                      >
                                        {getStatusIcon(status || undefined)}
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
                                        className="absolute -top-1 -right-1 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
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
              <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-10 text-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#34C759] rounded-xl flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                </div>
                    <span className="text-gray-700 font-semibold">Present</span>
                </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#FF3B30] rounded-xl flex items-center justify-center shadow-sm">
                      <X className="w-4 h-4 text-white" />
                </div>
                    <span className="text-gray-700 font-semibold">Absent</span>
                </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#FFCC00] rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-4 h-4 text-white" />
                </div>
                    <span className="text-gray-700 font-semibold">Late</span>
                </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#007AFF] rounded-xl flex items-center justify-center shadow-sm">
                      <Shield className="w-4 h-4 text-white" />
              </div>
                    <span className="text-gray-700 font-semibold">Excused</span>
              </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#D1D5DB] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-gray-500 text-sm font-medium">–</span>
            </div>
                    <span className="text-gray-700 font-semibold">No Record</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500 mt-4 font-medium">
                  Click on any cell to mark attendance
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Class and Subject</h3>
                <p className="text-gray-600">Please select a class and subject to view the attendance</p>
              </div>
            </div>
        )}
      </AnimatePresence>

        {/* Status Selection Modal */}
      <AnimatePresence>
          {showStatusModal && selectedCell && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Mark Attendance</h3>
                  <span className="text-xs font-semibold text-blue-600">Lesson {currentLessonForm}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handleStatusSelect('NO_RECORD')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                      getCurrentStatusForModal(selectedCell.student, selectedCell.date) === null 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    No Record
                  </button>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">
                      {selectedCell.student.lastName}, {selectedCell.student.firstName}
                  </h4>
                    <p className="text-gray-600 font-medium text-xs sm:text-sm">
                      {format(selectedCell.date, 'MMMM dd, yyyy')}
                  </p>
                </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-sm sm:text-base font-semibold text-gray-700">Comment (optional)</label>
                  <textarea
                    placeholder="Add a comment about this student's attendance..."
                      value={currentComment}
                      onChange={(e) => setCurrentComment(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 italic">
                      💡 Tip: Add a comment first if you need to provide additional details about this student's attendance.
                    </p>
                </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-sm sm:text-base font-semibold text-gray-700">Attendance Status</label>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                        onClick={() => handleStatusSelect('PRESENT')}
                        className={`p-1.5 sm:p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${
                          getCurrentStatusForModal(selectedCell.student, selectedCell.date) === 'PRESENT' 
                            ? 'bg-[#228B22] border-[#1a6b1a] text-white' 
                            : 'bg-[#34C759] border-[#228B22] text-white hover:bg-[#228B22]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" />
                          <span className="font-semibold text-xs">Present</span>
                        </div>
                  </button>
                  <button
                        onClick={() => handleStatusSelect('ABSENT')}
                        className={`p-1.5 sm:p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${
                          getCurrentStatusForModal(selectedCell.student, selectedCell.date) === 'ABSENT' 
                            ? 'bg-[#B22222] border-[#8b1a1a] text-white' 
                            : 'bg-[#FF3B30] border-[#B22222] text-white hover:bg-[#B22222]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <X className="w-3 h-3" />
                          <span className="font-semibold text-xs">Absent</span>
                </div>
                      </button>
                <button
                        onClick={() => handleStatusSelect('LATE')}
                        className={`p-1.5 sm:p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${
                          getCurrentStatusForModal(selectedCell.student, selectedCell.date) === 'LATE' 
                            ? 'bg-[#B8860B] border-[#9a6b08] text-white' 
                            : 'bg-[#FFCC00] border-[#B8860B] text-white hover:bg-[#B8860B]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-semibold text-xs">Late</span>
              </div>
                      </button>
                <button
                        onClick={() => handleStatusSelect('EXCUSED')}
                        className={`p-1.5 sm:p-2 rounded-md border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${
                          getCurrentStatusForModal(selectedCell.student, selectedCell.date) === 'EXCUSED' 
                            ? 'bg-[#1E3A8A] border-[#1a2f6b] text-white' 
                            : 'bg-[#007AFF] border-[#1E3A8A] text-white hover:bg-[#1E3A8A]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span className="font-semibold text-xs">Excused</span>
                        </div>
                </button>
                </div>
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
                    </div>
                  )}
        </AnimatePresence>

        {/* Simple Mark All Present Modal */}
        <AnimatePresence>
          {showBulkDateModal && selectedDate && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">Mark Attendance - Lesson {currentLessonForm}</h3>
                      <p className="text-blue-100 mt-1">
                        {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBulkDateModal(false);
                        setSelectedDate(null);
                        setCurrentLessonForm(1);
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-6 text-center">
                    Click the button below to mark all {students.length} students as present for <strong>Lesson {currentLessonForm}</strong>.
                    <br />
                    <span className="text-sm text-gray-500 mt-2 block">
                      You can then click on individual cells in the grid to change any student's status.
                    </span>
                  </p>

                  <button
                    onClick={handleMarkAllPresent}
                    disabled={isSavingBulk}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg mb-4"
                  >
                    {isSavingBulk ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Marking All Present...
                      </>
                    ) : (
                      <>
                        <Check className="w-6 h-6" />
                        Mark All Present (Lesson {currentLessonForm})
                      </>
                    )}
                  </button>

                  {/* Lesson Navigation */}
                  <div className="flex gap-2">
                    {currentLessonForm === 2 && (
                      <button
                        onClick={() => setCurrentLessonForm(1)}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                      >
                        ← Back to Lesson 1
                      </button>
                    )}
                    {currentLessonForm === 1 && (
                      <button
                        onClick={() => setCurrentLessonForm(2)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md"
                      >
                        Extra → Lesson 2
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
                </div>
              </div>
  );
};

export default TeacherAttendanceGrid;