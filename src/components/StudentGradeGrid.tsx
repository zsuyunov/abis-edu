"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Filter, Eye, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
}

interface GradeRecord {
  id: string;
  date: string;
  grade: number;
  description?: string;
  subject: {
    id: string;
    name: string;
  };
  teacher?: {
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeRecord | null>(null);

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
      // Calculate start and end dates for the month
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedSubject && { subjectId: selectedSubject })
      });

      console.log('🔍 Fetching grades:', {
        studentId,
        startDate,
        endDate,
        selectedSubject,
        url: `/api/student-grades?${params}`
      });

      const response = await fetch(`/api/student-grades?${params}`, {
        headers: {
          'x-user-id': studentId
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Grade API Response:', result);
        
        // Check total count of grades for this student
        if (result.success && result.totalCount === 0) {
          // Try to get total count without date filter
          const countResponse = await fetch(`/api/student-grades`, {
            headers: {
              'x-user-id': studentId
            }
          });
          if (countResponse.ok) {
            const countData = await countResponse.json();
            console.log(`📊 Total grades for student: ${countData.totalCount}`);
            if (countData.totalCount > 0) {
              console.log('📅 Sample grades:', countData.grades?.slice(0, 5));
            }
          }
        }
        
        let gradeRecords = result.grades || result.data?.grades || [];
        
        // Transform data to match expected format
        gradeRecords = gradeRecords.map((record: any) => {
          console.log('🔄 Transforming record:', record);
          return {
            id: record.id?.toString() || record.id,
            date: record.date,
            grade: record.percentage || record.grade || ((record.value / record.maxValue) * 100) || 0,
            description: record.description,
            subject: {
              id: record.subject?.id?.toString() || record.subjectId?.toString() || '',
              name: record.subject?.name || record.subject || 'Unknown'
            },
            teacher: record.teacher ? (
              typeof record.teacher === 'string' ? {
                id: record.teacher.split(' ')[0],
                firstName: record.teacher.split(' ')[0] || '',
                lastName: record.teacher.split(' ')[1] || ''
              } : {
                id: record.teacher.id,
                firstName: record.teacher.firstName || '',
                lastName: record.teacher.lastName || ''
              }
            ) : undefined
          };
        });
        
        console.log('📝 Parsed grade records:', gradeRecords);
        console.log('📏 Grade count:', gradeRecords.length);
        if (gradeRecords.length > 0) {
          console.log('📊 First grade sample:', gradeRecords[0]);
        }
        setGradeData(Array.isArray(gradeRecords) ? gradeRecords : []);
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeForSubjectAndDate = (subjectId: string, date: Date) => {
    if (!Array.isArray(gradeData)) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const found = gradeData.find(record => {
      const recordSubjectId = record.subject?.id?.toString() || '';
      const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
      const match = recordSubjectId === subjectId && recordDate === dateStr;
      return match;
    });
    return found;
  };

  const getGradeColor = (grade: number | undefined) => {
    if (grade === undefined || grade === null) return 'bg-[#D1D5DB]';
    if (grade >= 90) return 'bg-[#22C55E]'; // Green
    if (grade >= 80) return 'bg-[#3B82F6]'; // Blue
    if (grade >= 70) return 'bg-[#06B6D4]'; // Cyan
    if (grade >= 60) return 'bg-[#F59E0B]'; // Orange
    if (grade >= 40) return 'bg-[#EF4444]'; // Red
    return 'bg-[#991B1B]'; // Dark Red
  };

  const getGradeIcon = (grade: number | undefined) => {
    if (grade === undefined || grade === null) {
      return <span className="text-gray-500 text-sm font-medium">–</span>;
    }
    return <span className="text-white text-sm font-bold">{Math.round(grade)}</span>;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleCellClick = (grade: GradeRecord | null) => {
    if (grade) {
      setSelectedGrade(grade);
      setShowDetailModal(true);
    }
  };

  const calculateSubjectAverage = (subjectId: string) => {
    const subjectGrades = gradeData.filter(g => g.subject.id === subjectId && g.grade !== null && g.grade !== undefined);
    if (subjectGrades.length === 0) return null;
    const sum = subjectGrades.reduce((acc, g) => acc + g.grade, 0);
    return Math.round(sum / subjectGrades.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Grade Calendar</h2>
                <p className="text-sm text-gray-600">View your grades by subject</p>
              </div>
            </div>
          </div>

          {/* Subject Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
            >
              <option value="">All Subjects</option>
              {Array.isArray(subjects) && subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            
            <h3 className="text-lg font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Grid Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="text-gray-600 font-medium">Loading grades...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="overflow-auto max-h-[600px] relative">
                <table className="min-w-full border-collapse">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="sticky left-0 z-40 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r-2 border-gray-300 min-w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Subject
                      </th>
                      <th className="sticky left-[160px] z-40 bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r-2 border-gray-300 min-w-[80px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Avg
                      </th>
                      {monthDays.map((day, index) => (
                        <th key={day.toISOString()} className={`px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-100 min-w-[60px] ${
                          index % 7 === 5 || index % 7 === 6 ? 'bg-gray-100' : 'bg-gray-50'
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className="text-base font-bold text-gray-900">{format(day, 'dd')}</span>
                            <span className="text-xs text-gray-500">{format(day, 'EEE')}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Array.isArray(subjects) && subjects.filter(subject => 
                      !selectedSubject || subject.id === selectedSubject
                    ).map((subject, subjectIndex) => {
                      const avg = calculateSubjectAverage(subject.id);
                      return (
                        <tr key={subject.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                          subjectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}>
                          <td className="sticky left-0 z-20 px-4 py-3 text-sm font-medium text-gray-900 border-r-2 border-gray-300 min-w-[160px] bg-gradient-to-r from-white via-white to-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="truncate font-semibold">{subject.name}</div>
                          </td>
                          <td className="sticky left-[160px] z-20 px-4 py-3 text-center border-r-2 border-gray-300 min-w-[80px] bg-gradient-to-r from-gray-50 via-gray-50 to-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${
                              avg !== null ? getGradeColor(avg) + ' text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {avg !== null ? avg : '–'}
                            </div>
                          </td>
                          {monthDays.map((day, dayIndex) => {
                            const grade = getGradeForSubjectAndDate(subject.id, day);
                            
                            return (
                              <td 
                                key={day.toISOString()} 
                                className={`px-2 py-3 text-center border-r border-gray-100 min-w-[60px] ${
                                  dayIndex % 7 === 5 || dayIndex % 7 === 6 ? 'bg-gray-50/50' : 'bg-white'
                                }`}
                              >
                                {grade ? (
                                  <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCellClick(grade)}
                                    className={`w-10 h-10 rounded-xl ${getGradeColor(grade.grade)} flex items-center justify-center transition-all duration-200 hover:shadow-lg mx-auto`}
                                    title={`Click to view details - Grade: ${Math.round(grade.grade)}%`}
                                  >
                                    {getGradeIcon(grade.grade)}
                                  </motion.button>
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                                    <span className="text-gray-400 text-xs">–</span>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {gradeData.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No grade records found for this period.</p>
          </div>
        )}

        {/* Legend */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Grade Scale</h4>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#22C55E] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">95</span>
              </div>
              <span className="text-gray-700 font-semibold">90-100%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">85</span>
              </div>
              <span className="text-gray-700 font-semibold">80-89%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#06B6D4] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">75</span>
              </div>
              <span className="text-gray-700 font-semibold">70-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F59E0B] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">65</span>
              </div>
              <span className="text-gray-700 font-semibold">60-69%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#EF4444] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">50</span>
              </div>
              <span className="text-gray-700 font-semibold">40-59%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#991B1B] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">35</span>
              </div>
              <span className="text-gray-700 font-semibold">Below 40%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#D1D5DB] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-gray-500 text-sm font-medium">–</span>
              </div>
              <span className="text-gray-700 font-semibold">No Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal (View Only) */}
      <AnimatePresence>
        {showDetailModal && selectedGrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className={`p-6 ${getGradeColor(selectedGrade.grade)} text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(selectedGrade.grade)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Grade Details</h3>
                      <p className="text-white/90 text-sm">View-only mode</p>
                    </div>
                  </div>
                  <Eye className="w-5 h-5" />
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Subject</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">{selectedGrade.subject.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {format(new Date(selectedGrade.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Grade</label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(selectedGrade.grade)}%</p>
                </div>
                
                {selectedGrade.teacher && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teacher</label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {selectedGrade.teacher.firstName} {selectedGrade.teacher.lastName}
                    </p>
                  </div>
                )}
                
                {selectedGrade.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teacher's Comment</label>
                    <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedGrade.description}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentGradeGrid;
