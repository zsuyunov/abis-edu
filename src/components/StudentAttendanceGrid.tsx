"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Filter, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  subject: {
    id: string;
    name: string;
  };
  timetable: {
    startTime: string;
    endTime: string;
  };
}

interface StudentAttendanceGridProps {
  studentId: string;
}

const StudentAttendanceGrid: React.FC<StudentAttendanceGridProps> = ({ studentId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    fetchSubjects();
  }, [studentId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [studentId, selectedSubject, currentDate]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/api/student-subjects?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Subjects API Response:', data);
        setSubjects(data.subjects || data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentId,
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedSubject && { subjectId: selectedSubject })
      });

      const response = await fetch(`/api/student-attendance?${params}`);
      if (response.ok) {
        const result = await response.json();
        const attendanceRecords = result.data?.attendanceRecords || result.attendanceRecords || result.data || result;
        setAttendanceData(Array.isArray(attendanceRecords) ? attendanceRecords : []);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForDate = (date: Date) => {
    if (!Array.isArray(attendanceData)) return [];
    return attendanceData.filter(record => 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ABSENT': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'LATE': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'EXCUSED': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-200" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200';
      case 'ABSENT': return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200';
      case 'LATE': return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200';
      case 'EXCUSED': return 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200';
      default: return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const getMonthStats = () => {
    const monthAttendance = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const total = monthAttendance.length;
    const present = monthAttendance.filter(r => r.status === 'PRESENT').length;
    const absent = monthAttendance.filter(r => r.status === 'ABSENT').length;
    const late = monthAttendance.filter(r => r.status === 'LATE').length;
    const excused = monthAttendance.filter(r => r.status === 'EXCUSED').length;

    return { total, present, absent, late, excused };
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
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Attendance Calendar</h2>
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
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
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
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-50 to-slate-50 p-3 rounded-xl text-center border border-gray-100"
                >
                  <h4 className="text-xs font-medium text-gray-700">Total</h4>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl text-center border border-green-100"
                >
                  <h4 className="text-xs font-medium text-green-700">Present</h4>
                  <p className="text-lg font-bold text-green-900">{stats.present}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-xl text-center border border-red-100"
                >
                  <h4 className="text-xs font-medium text-red-700">Absent</h4>
                  <p className="text-lg font-bold text-red-900">{stats.absent}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-yellow-50 to-amber-50 p-3 rounded-xl text-center border border-yellow-100"
                >
                  <h4 className="text-xs font-medium text-yellow-700">Late</h4>
                  <p className="text-lg font-bold text-yellow-900">{stats.late}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-sky-50 p-3 rounded-xl text-center border border-blue-100"
                >
                  <h4 className="text-xs font-medium text-blue-700">Excused</h4>
                  <p className="text-lg font-bold text-blue-900">{stats.excused}</p>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                      const subjectAttendance = attendanceData.filter(record => 
                        !selectedSubject || record.subject.id === subject.id
                      );
                      
                      if (selectedSubject && selectedSubject !== subject.id) return null;
                      
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
                          {monthDays.map(day => {
                            const dayAttendance = getAttendanceForDate(day).filter(record => 
                              record.subject.id === subject.id
                            );
                            const hasMultiple = dayAttendance.length > 1;
                            const primaryRecord = dayAttendance[0];
                            
                            return (
                              <td key={day.toISOString()} className={`px-2 py-3 text-center border-r border-gray-50 min-w-[40px] ${primaryRecord ? getStatusColor(primaryRecord.status) : 'bg-gray-25'}`}>
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  className="flex flex-col items-center justify-center"
                                >
                                  {primaryRecord && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      {getStatusIcon(primaryRecord.status)}
                                    </motion.div>
                                  )}
                                  {hasMultiple && (
                                    <div className="flex mt-1 gap-1">
                                      {dayAttendance.slice(1).map((record, idx) => (
                                        <motion.div 
                                          key={idx} 
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.2 + idx * 0.1 }}
                                          className="text-xs"
                                        >
                                          {getStatusIcon(record.status)}
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
          {attendanceData.length === 0 && !loading && (
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
              <p className="text-gray-500 text-sm">No attendance records found for this period.</p>
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
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Legend</h4>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">Present</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-gray-700">Absent</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-gray-700">Late</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm"
            >
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">Excused</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StudentAttendanceGrid;
