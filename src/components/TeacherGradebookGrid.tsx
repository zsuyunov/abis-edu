"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, BookOpen, Calendar, Check, X, Clock, Shield, Save, Edit3, MessageSquare } from 'lucide-react';

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

interface PendingGrade {
  studentId: string;
  date: string;
  value: number;
  comment: string;
  isNoRecord?: boolean;
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
  const [pendingGrades, setPendingGrades] = useState<PendingGrade[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ student: Student; date: Date } | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<number>(0);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [customGradeInput, setCustomGradeInput] = useState<string>('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/students/by-class?classId=${selectedClass}`);
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

      const response = await fetch(`/api/grades?${params}`);
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

  const getPendingGradeForStudentAndDate = (studentId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return pendingGrades.find(pending => 
      pending.studentId === studentId && pending.date === dateString
    );
  };

  const getGradeForStudentAndDate = (studentId: string, date: Date) => {
    // Check pending grade first
    const pending = getPendingGradeForStudentAndDate(studentId, date);
    if (pending) {
      return pending.isNoRecord ? 'NO_RECORD' : pending.value;
    }

    // Check existing grade
    const existing = gradeData.find(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    return existing ? existing.value : null;
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
    
    // Check if there's existing grade data for this student and date
    const existingGrade = getGradeForStudentAndDate(student.id, date);
    const pendingGrade = getPendingGradeForStudentAndDate(student.id, date);
    
    // Find the existing grade record to get the comment
    const existingGradeRecord = gradeData.find(record => 
      record.studentId === student.id && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    // Set the current grade and comment
    if (pendingGrade) {
      setCurrentGrade(pendingGrade.value);
      setCurrentComment(pendingGrade.comment);
      setCustomGradeInput(pendingGrade.value.toString());
    } else if (existingGrade !== null && existingGrade !== 'NO_RECORD') {
      setCurrentGrade(existingGrade as number);
      setCurrentComment(existingGradeRecord?.description || '');
      setCustomGradeInput(existingGrade.toString());
    } else {
      setCurrentGrade(0);
      setCurrentComment('');
      setCustomGradeInput('');
    }
    
    setShowGradeModal(true);
  };


  const handleGradeSubmit = () => {
    if (!selectedCell) return;

    const gradeValue = parseInt(customGradeInput);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
      alert('Please enter a valid grade between 0 and 100');
      return;
    }

    const { student, date } = selectedCell;
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Remove existing pending grade for this student and date
    setPendingGrades(prev => 
      prev.filter(pending => !(pending.studentId === student.id && pending.date === dateString))
    );

    // Add new pending grade
    setPendingGrades(prev => [
      ...prev,
      {
        studentId: student.id,
        date: dateString,
        value: gradeValue,
        comment: currentComment
      }
    ]);

    setShowGradeModal(false);
    setSelectedCell(null);
    setCurrentGrade(0);
    setCurrentComment('');
    setCustomGradeInput('');
  };

  const handleNoRecord = () => {
    if (!selectedCell) return;

    const { student, date } = selectedCell;
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Remove existing pending grade for this student and date
    setPendingGrades(prev => 
      prev.filter(pending => !(pending.studentId === student.id && pending.date === dateString))
    );

    // Add new pending grade with No Record status
    setPendingGrades(prev => [
      ...prev,
      {
        studentId: student.id,
        date: dateString,
        value: 0,
        comment: '',
        isNoRecord: true
      }
    ]);

    setShowGradeModal(false);
    setSelectedCell(null);
    setCurrentGrade(0);
    setCurrentComment('');
    setCustomGradeInput('');
  };

  const handleBulkSave = async () => {
    if (pendingGrades.length === 0) return;

    setIsSaving(true);
    try {
      // Filter out No Record entries and handle deletions separately
      const recordsToSave = pendingGrades.filter(pending => !pending.isNoRecord);
      const recordsToDelete = pendingGrades.filter(pending => pending.isNoRecord);

      // Save grade records
      const savePromises = recordsToSave.map(async (pending) => {
        const response = await fetch('/api/grades', {
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
            value: pending.value,
            description: pending.comment,
          }),
        });

        if (response.ok) {
          return await response.json();
        }
        throw new Error(`Failed to save grade for student ${pending.studentId}`);
      });

      // Delete grade records (No Record)
      const deletePromises = recordsToDelete.map(async (pending) => {
        const response = await fetch('/api/grades', {
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
        throw new Error(`Failed to delete grade for student ${pending.studentId}`);
      });

      await Promise.all([...savePromises, ...deletePromises]);
      
      // Clear pending grades
      setPendingGrades([]);
      
      // Refresh grade data
      fetchGradeData();
      
      alert(`✅ Successfully processed ${recordsToSave.length} saves and ${recordsToDelete.length} deletions!`);
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('❌ Error saving grades. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gradebook</h1>
          <p className="text-gray-600">Track and manage student grades</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Users className="w-5 h-5 inline mr-2" />
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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

        {/* Pending Grades */}
        {pendingGrades.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Save className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-blue-800 font-semibold text-lg">
                    {pendingGrades.length} grade record(s) pending save
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
                  <p className="text-gray-600 font-medium">Loading grade data...</p>
                </div>
              </div>
            </div>
          ) : selectedClass && selectedSubject ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
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
                            const grade = getGradeForStudentAndDate(student.id, day);
                            return (
                              <td 
                                key={day.toISOString()} 
                                className="px-3 py-4 text-center min-w-[60px]"
                              >
                                <button
                                  onClick={() => handleCellClick(student, day)}
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 transform ${getGradeColor(grade)}`}
                                >
                                  {getGradeIcon(grade)}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#22C55E] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">95</span>
                    </div>
                    <span className="text-gray-700 font-semibold">90-100%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">85</span>
                    </div>
                    <span className="text-gray-700 font-semibold">80-89%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#06B6D4] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">75</span>
                    </div>
                    <span className="text-gray-700 font-semibold">70-79%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F59E0B] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">65</span>
                    </div>
                    <span className="text-gray-700 font-semibold">60-69%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#EF4444] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">50</span>
                    </div>
                    <span className="text-gray-700 font-semibold">40-59%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#991B1B] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-bold">35</span>
                    </div>
                    <span className="text-gray-700 font-semibold">Below 40%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#D1D5DB] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-gray-500 text-sm font-medium">–</span>
                    </div>
                    <span className="text-gray-700 font-semibold">No Grade</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500 mt-4 font-medium">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Mark Grade</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleNoRecord}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm"
                  >
                    No Record
                  </button>
                  <button
                    onClick={() => setShowGradeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="font-bold text-gray-900 text-lg">
                  {selectedCell.student.lastName}, {selectedCell.student.firstName}
                </div>
                <div className="text-gray-600 text-sm">
                  {format(selectedCell.date, 'MMMM dd, yyyy')}
                </div>
              </div>

              {/* Comment Field */}
              <div className="space-y-3 mb-6">
                <label className="text-lg font-semibold text-gray-700">Comment (optional)</label>
                <textarea
                  placeholder="Add a comment about this student's grade..."
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                  rows={4}
                />
                <p className="text-sm text-gray-500 italic">
                  💡 Tip: Add a comment first if you need to provide additional details about this student's grade.
                </p>
              </div>

              {/* Grade Input */}
              <div className="space-y-4 mb-6">
                <label className="text-lg font-semibold text-gray-700">Grade (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customGradeInput}
                  onChange={(e) => setCustomGradeInput(e.target.value)}
                  placeholder="Enter grade (0-100)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleNoRecord}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium"
                >
                  No Record
                </button>
                <button
                  onClick={handleGradeSubmit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Add Grade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherGradebookGrid;
