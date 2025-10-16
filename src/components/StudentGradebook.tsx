"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, BookOpen, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
}

interface GradeRecord {
  id: string;
  date: string;
  grade: number;
  notes?: string;
  lessonNumber?: number;
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface StudentGradebookProps {
  studentId: string;
}

const StudentGradebook: React.FC<StudentGradebookProps> = ({ studentId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeData, setGradeData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Animation state for lesson swapping
  const [showingLesson, setShowingLesson] = useState<1 | 2>(1);
  const [isSwapping, setIsSwapping] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    fetchSubjects();
  }, [studentId]);

  useEffect(() => {
    fetchGradeData();
  }, [studentId, selectedSubject, currentDate]);

  // Check if lesson 2 exists for swap animation
  const hasLesson2 = () => {
    if (!Array.isArray(gradeData) || gradeData.length === 0) return false;
    return gradeData.some(r => r.lessonNumber === 2);
  };

  // Auto-swap between lesson 1 and 2 every 3 seconds ONLY if at least one record has both lessons
  useEffect(() => {
    setIsSwapping(false);
    setShowingLesson(1);
    
    // Check if ANY record has BOTH lesson 1 and lesson 2 records
    const anyRecordHasBothLessons = gradeData.some(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      const recordsForDate = gradeData.filter(r => 
        format(new Date(r.date), 'yyyy-MM-dd') === dateStr
      );
      
      const hasLesson1 = recordsForDate.some(r => r.lessonNumber === 1 || !r.lessonNumber);
      const hasLesson2 = recordsForDate.some(r => r.lessonNumber === 2);
      
      return hasLesson1 && hasLesson2;
    });
    
    // If NO record has both lessons, DO NOT start any animation
    if (!anyRecordHasBothLessons) {
      return; // Exit early, no timer created
    }

    // If at least one record has both lessons, start the swap animation
    const timer = setInterval(() => {
      setShowingLesson(prev => prev === 1 ? 2 : 1);
      setIsSwapping(true);
      setTimeout(() => setIsSwapping(false), 300);
    }, 3000);

    return () => clearInterval(timer);
  }, [gradeData]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/api/student-subjects?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchGradeData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentId,
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedSubject && { subjectId: selectedSubject })
      });

      const response = await fetch(`/api/grades/student-history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGradeData(data);
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradesForDay = (day: Date) => {
    return gradeData.filter(record => 
      isSameDay(new Date(record.date), day)
    );
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (grade >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (grade >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const getSubjectStats = () => {
    const filteredGrades = selectedSubject 
      ? gradeData.filter(g => g.subject.id === selectedSubject)
      : gradeData;

    if (filteredGrades.length === 0) return { average: 0, highest: 0, lowest: 0, count: 0 };

    const grades = filteredGrades.map(g => g.grade);
    const average = Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    return { average, highest, lowest, count: grades.length };
  };

  // Get grade for specific subject, date, and lesson
  const getGradeForSubjectAndDateAndLesson = (subjectId: string, date: Date, lessonNum: number = 1) => {
    if (!Array.isArray(gradeData)) return null;
    return gradeData.find(record => 
      record.subject.id === subjectId &&
      isSameDay(new Date(record.date), date) &&
      (record.lessonNumber === lessonNum || (!record.lessonNumber && lessonNum === 1))
    );
  };

  // Get grade to display based on showing lesson (for swap animation)
  const getDisplayGrade = (subjectId: string, date: Date) => {
    // Only use swap animation if this specific subject/date has both lessons
    const hasBothLessonsForThisDate = hasBothLessonsForDate(date);
    const lessonToShow = hasBothLessonsForThisDate ? showingLesson : 1;
    return getGradeForSubjectAndDateAndLesson(subjectId, date, lessonToShow);
  };

  // Check if there are both lessons on a date
  const hasBothLessonsForDate = (date: Date): boolean => {
    if (!Array.isArray(gradeData)) return false;
    
    const recordsForDate = gradeData.filter(r => 
      isSameDay(new Date(r.date), date)
    );
    
    const hasLesson1 = recordsForDate.some(r => r.lessonNumber === 1 || !r.lessonNumber);
    const hasLesson2Records = recordsForDate.some(r => r.lessonNumber === 2);
    
    return hasLesson1 && hasLesson2Records;
  };

  const stats = getSubjectStats();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          My Grades
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {Array.isArray(subjects) && subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
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
        {stats.count > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">Average Grade</h4>
              <p className="text-2xl font-bold text-blue-900">{stats.average}%</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">Highest Grade</h4>
              <p className="text-2xl font-bold text-green-900">{stats.highest}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-700">Lowest Grade</h4>
              <p className="text-2xl font-bold text-yellow-900">{stats.lowest}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-700">Total Grades</h4>
              <p className="text-2xl font-bold text-purple-900">{stats.count}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {monthDays.map(day => {
            const dayGrades = getGradesForDay(day);
            const hasData = dayGrades.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border rounded-md ${
                  hasData ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {format(day, 'd')}
                </div>
                
                {dayGrades.length > 0 && (
                  <div className="space-y-1">
                    {dayGrades.map(record => {
                      const hasBothLessons = hasBothLessonsForDate(day);
                      const displayRecord = getDisplayGrade(record.subject.id, day);
                      
                      return (
                        <div
                          key={record.id}
                          className={`text-xs px-2 py-1 rounded-full border ${getGradeColor(record.grade)} ${
                            hasLesson2() && isSwapping ? 'scale-95 opacity-70' : ''
                          }`}
                          title={`${record.subject.name}: ${record.grade}%${record.notes ? ` - ${record.notes}` : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{record.subject.name}</span>
                            <div className="flex items-center gap-1">
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={displayRecord?.grade || 'none'}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeInOut"
                                  }}
                                  className="font-bold"
                                >
                                  {displayRecord?.grade || record.grade}%
                                </motion.span>
                              </AnimatePresence>
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
                                    className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                                  >
                                    L{showingLesson}
                                  </motion.span>
                                </AnimatePresence>
                              )}
                            </div>
                          </div>
                          {record.notes && (
                            <div className="text-xs opacity-75 mt-1 truncate">
                              {record.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {gradeData.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No grades found for the selected period.</p>
          {selectedSubject && (
            <p className="text-sm mt-2">Try selecting "All Subjects" or a different month.</p>
          )}
        </div>
      )}

      {/* Grade Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Grade Scale</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>90-100% Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>80-89% Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>70-79% Satisfactory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span>60-69% Fair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>&lt;60% Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGradebook;
