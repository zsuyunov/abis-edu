"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Filter, Trophy, TrendingUp, Award } from 'lucide-react';
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

interface StudentGradeGridProps {
  studentId: string;
}

const StudentGradeGrid: React.FC<StudentGradeGridProps> = ({ studentId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeData, setGradeData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    fetchSubjects();
  }, [studentId]);

  useEffect(() => {
    fetchGradeData();
  }, [studentId, selectedSubject, currentDate]);

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

  const getGradesForDate = (date: Date) => {
    if (!Array.isArray(gradeData)) return [];
    return gradeData.filter(record => 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getGradeColor = (grade: number | undefined) => {
    if (grade === undefined) return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200';
    if (grade >= 90) return 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 text-emerald-800';
    if (grade >= 80) return 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-300 text-blue-800';
    if (grade >= 70) return 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 text-amber-800';
    if (grade >= 60) return 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 text-orange-800';
    return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 text-red-800';
  };

  const getGradeIcon = (grade: number | undefined) => {
    if (grade === undefined) return null;
    if (grade >= 90) return <Trophy className="w-3 h-3 text-emerald-600" />;
    if (grade >= 80) return <Award className="w-3 h-3 text-blue-600" />;
    if (grade >= 70) return <TrendingUp className="w-3 h-3 text-amber-600" />;
    return null;
  };

  const getSubjectAverage = (subjectId: string) => {
    const subjectGrades = gradeData.filter(grade => grade.subject.id === subjectId);
    if (subjectGrades.length === 0) return 0;
    const sum = subjectGrades.reduce((acc, grade) => acc + grade.grade, 0);
    return Math.round(sum / subjectGrades.length);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const getMonthStats = () => {
    const monthGrades = gradeData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    if (monthGrades.length === 0) return { total: 0, average: 0, highest: 0, lowest: 0 };

    const grades = monthGrades.map(g => g.grade);
    const average = Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    return { total: monthGrades.length, average, highest, lowest };
  };

  const stats = getMonthStats();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Grade Calendar</h2>
          </div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">All Subjects</option>
              {Array.isArray(subjects) && subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </motion.div>

          {/* Month Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth('prev')}
              className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            <h3 className="text-lg font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth('next')}
              className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Statistics */}
          <AnimatePresence>
            {stats.total > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-sky-50 p-3 rounded-xl text-center border border-blue-100"
                >
                  <h4 className="text-xs font-medium text-blue-700">Total</h4>
                  <p className="text-lg font-bold text-blue-900">{stats.total}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-xl text-center border border-emerald-100"
                >
                  <h4 className="text-xs font-medium text-emerald-700">Avg</h4>
                  <p className="text-lg font-bold text-emerald-900">{stats.average}%</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-xl text-center border border-amber-100"
                >
                  <h4 className="text-xs font-medium text-amber-700">High</h4>
                  <p className="text-lg font-bold text-amber-900">{stats.highest}%</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-rose-50 to-red-50 p-3 rounded-xl text-center border border-rose-100"
                >
                  <h4 className="text-xs font-medium text-rose-700">Low</h4>
                  <p className="text-lg font-bold text-rose-900">{stats.lowest}%</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-32"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.4 }}
            >
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200 min-w-[120px]">
                        Subject
                      </th>
                      <th className="sticky left-[120px] z-10 bg-gradient-to-r from-gray-50 to-slate-50 px-3 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 min-w-[60px]">
                        Avg
                      </th>
                      {monthDays.map(day => (
                        <th key={day.toISOString()} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[40px]">
                          <div className="text-sm font-semibold">{format(day, 'dd')}</div>
                          <div className="text-xs text-gray-400">{format(day, 'EEE')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {Array.isArray(subjects) && subjects.map((subject, index) => {
                      if (selectedSubject && selectedSubject !== subject.id) return null;
                      
                      const subjectAvg = getSubjectAverage(subject.id);
                      
                      return (
                        <motion.tr 
                          key={subject.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                        >
                          <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-100 min-w-[120px]">
                            <div className="truncate">{subject.name}</div>
                          </td>
                          <td className={`sticky left-[120px] z-10 bg-inherit px-3 py-3 text-sm font-medium text-center border-r border-gray-100 min-w-[60px] ${getGradeColor(subjectAvg > 0 ? subjectAvg : undefined)}`}>
                            <div className="flex items-center justify-center gap-1">
                              {subjectAvg > 0 ? `${subjectAvg}%` : '-'}
                              {getGradeIcon(subjectAvg)}
                            </div>
                          </td>
                          {monthDays.map(day => {
                            const dayGrades = getGradesForDate(day).filter(record => 
                              record.subject.id === subject.id
                            );
                            const hasMultiple = dayGrades.length > 1;
                            const primaryGrade = dayGrades[0];
                            
                            return (
                              <td key={day.toISOString()} className={`px-2 py-3 text-center border-r border-gray-50 min-w-[40px] ${getGradeColor(primaryGrade?.grade)}`}>
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  className="flex flex-col items-center justify-center"
                                >
                                  {primaryGrade && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.1 }}
                                      className="cursor-pointer flex items-center gap-1"
                                      title={`${primaryGrade.subject.name}: ${primaryGrade.grade}%${primaryGrade.notes ? ` - ${primaryGrade.notes}` : ''}`}
                                    >
                                      <span className="text-sm font-semibold">{primaryGrade.grade}</span>
                                      {getGradeIcon(primaryGrade.grade)}
                                    </motion.div>
                                  )}
                                  {hasMultiple && (
                                    <div className="flex flex-col mt-1 gap-1">
                                      {dayGrades.slice(1).map((grade, idx) => (
                                        <motion.div 
                                          key={idx} 
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.2 + idx * 0.1 }}
                                          className={`text-xs px-1 py-0.5 rounded ${getGradeColor(grade.grade)}`}
                                          title={`${grade.subject.name}: ${grade.grade}%${grade.notes ? ` - ${grade.notes}` : ''}`}
                                        >
                                          {grade.grade}
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            );
                          })}
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gradeData.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              </motion.div>
              <p className="text-gray-500 text-sm">No grade records found for this period.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 bg-gray-50/50 rounded-xl"
        >
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Grade Scale</h4>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded"></div>
              <span className="text-gray-700">90-100%</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded"></div>
              <span className="text-gray-700">80-89%</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded"></div>
              <span className="text-gray-700">70-79%</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded"></div>
              <span className="text-gray-700">60-69%</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded"></div>
              <span className="text-gray-700">&lt;60%</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudentGradeGrid;
