"use client";

import React, { useState, useEffect } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDaysInMonth, getDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, BookOpen, Calendar, Check, X, Clock, Shield, Save } from 'lucide-react';
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

interface PendingAttendance {
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NO_RECORD';
  comment: string;
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
  const [pendingAttendances, setPendingAttendances] = useState<PendingAttendance[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentComment, setCurrentComment] = useState('');

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

  const getAttendanceForStudentAndDate = (studentId: string, date: Date) => {
    if (!Array.isArray(attendanceData)) return null;
    return attendanceData.find(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getPendingAttendanceForStudentAndDate = (studentId: string, date: Date) => {
    return pendingAttendances.find(pending => 
      pending.studentId === studentId && 
      pending.date === format(date, 'yyyy-MM-dd')
    );
  };

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

  const handleCellClick = (student: Student, date: Date) => {
    setSelectedCell({ student, date });
    
    // Check if there's existing attendance data for this student and date
    const existingAttendance = getAttendanceForStudentAndDate(student.id, date);
    const pendingAttendance = getPendingAttendanceForStudentAndDate(student.id, date);
    
    // Set the current comment to existing comment if available
    if (pendingAttendance) {
      setCurrentComment(pendingAttendance.comment);
    } else if (existingAttendance) {
      setCurrentComment(existingAttendance.notes || '');
      } else {
      setCurrentComment('');
    }
    
    setShowStatusModal(true);
  };

  const handleStatusSelect = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NO_RECORD') => {
    if (!selectedCell) return;

    const { student, date } = selectedCell;
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Remove existing pending attendance for this student and date
    setPendingAttendances(prev => 
      prev.filter(pending => !(pending.studentId === student.id && pending.date === dateString))
    );

    // If NO_RECORD is selected, add it to pending attendances to mark for deletion
    if (status === 'NO_RECORD') {
      setPendingAttendances(prev => [
        ...prev,
        {
          studentId: student.id,
          date: dateString,
          status: 'NO_RECORD',
          comment: ''
        }
      ]);
      setShowStatusModal(false);
      setSelectedCell(null);
      setCurrentComment('');
      return;
    }

    // Add new pending attendance
    setPendingAttendances(prev => [
      ...prev,
      {
        studentId: student.id,
        date: dateString,
        status,
        comment: currentComment
      }
    ]);

    setShowStatusModal(false);
    setSelectedCell(null);
    setCurrentComment('');
  };

  const handleBulkSave = async () => {
    if (pendingAttendances.length === 0) return;

    setIsSaving(true);
    try {
      // Filter out NO_RECORD entries and handle deletions separately
      const recordsToSave = pendingAttendances.filter(pending => pending.status !== 'NO_RECORD');
      const recordsToDelete = pendingAttendances.filter(pending => pending.status === 'NO_RECORD');

      // Save attendance records
      const savePromises = recordsToSave.map(async (pending) => {
        const response = await csrfFetch('/api/attendance', {
          method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
          body: JSON.stringify({
            studentId: pending.studentId,
            classId: selectedClass,
            subjectId: selectedSubject,
            date: pending.date,
            status: pending.status,
            notes: pending.comment,
          }),
      });

      if (response.ok) {
          return await response.json();
        }
        throw new Error(`Failed to save attendance for student ${pending.studentId}`);
      });

      // Delete attendance records (NO_RECORD)
      const deletePromises = recordsToDelete.map(async (pending) => {
      const response = await csrfFetch('/api/attendance', {
          method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
            studentId: pending.studentId,
            classId: selectedClass,
            subjectId: selectedSubject,
            date: pending.date,
        }),
      });

      if (response.ok) {
          return await response.json();
        }
        throw new Error(`Failed to delete attendance for student ${pending.studentId}`);
      });

      await Promise.all([...savePromises, ...deletePromises]);
      
      // Clear pending attendances
      setPendingAttendances([]);
      
      // Refresh attendance data
        fetchAttendanceData();
      
      alert(`✅ Successfully processed ${recordsToSave.length} saves and ${recordsToDelete.length} deletions!`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('❌ Error saving attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCellStatus = (student: Student, date: Date) => {
    // Check pending attendance first
    const pending = getPendingAttendanceForStudentAndDate(student.id, date);
    if (pending) {
      return pending.status === 'NO_RECORD' ? null : pending.status;
    }

    // Check existing attendance
    const existing = getAttendanceForStudentAndDate(student.id, date);
    if (existing) {
      return existing.status;
    }

    return null;
  };

  const getCurrentStatusForModal = (student: Student, date: Date) => {
    // Check pending attendance first
    const pending = getPendingAttendanceForStudentAndDate(student.id, date);
    if (pending) {
      return pending.status === 'NO_RECORD' ? null : pending.status;
    }

    // Check existing attendance
    const existing = getAttendanceForStudentAndDate(student.id, date);
    if (existing) {
      return existing.status;
    }

    return null;
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

        {/* Bulk Save Button */}
        {pendingAttendances.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Save className="w-5 h-5 text-blue-600" />
                </div>
          <div>
                  <span className="text-blue-800 font-semibold text-lg">
                    {pendingAttendances.length} attendance record(s) pending save
                  </span>
                  <p className="text-blue-600 text-sm mt-1">Review your changes before saving</p>
          </div>
              </div>
              <button
                onClick={handleBulkSave}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
              >
                {isSaving ? 'Saving...' : 'Save All'}
              </button>
          </div>
          </div>
        )}

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
                          <div className="text-base font-bold">{format(day, 'dd')}</div>
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
                          <td className="sticky left-0 z-20 bg-white px-8 py-4 text-sm font-semibold text-gray-900 min-w-[220px] border-r border-gray-200">
                            <div className="font-bold text-gray-900">{student.lastName}, {student.firstName}</div>
                          </td>
                          {monthDays.map(day => {
                            const status = getCellStatus(student, day);
                            return (
                              <td 
                                key={day.toISOString()} 
                                className="px-3 py-4 text-center min-w-[60px]"
                              >
                                <button
                                  onClick={() => handleCellClick(student, day)}
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 transform ${getStatusColor(status || undefined)}`}
                                >
                                  {getStatusIcon(status || undefined)}
                                </button>
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
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Mark Attendance</h3>
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

                </div>
                    </div>
                    </div>
                  )}
        </AnimatePresence>
                </div>
              </div>
  );
};

export default TeacherAttendanceGrid;