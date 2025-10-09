"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, BookOpen, Filter, Check, X, Clock, Shield, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subject {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

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

      const response = await fetch(`/api/student-attendance?${params}`, {
        headers: {
          'x-user-id': studentId
        }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('📊 API Response:', result);
        console.log('🔍 Debug Info:', result.debug);
        const attendanceRecords = result.data?.attendanceRecords || result.attendanceRecords || result.data || result;
        console.log('📝 Parsed attendance records:', attendanceRecords);
        console.log('📏 Records array length:', Array.isArray(attendanceRecords) ? attendanceRecords.length : 'Not an array');
        setAttendanceData(Array.isArray(attendanceRecords) ? attendanceRecords : []);
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForSubjectAndDate = (subjectId: string, date: Date) => {
    if (!Array.isArray(attendanceData)) return null;
    return attendanceData.find(record => 
      record.subject.id === subjectId &&
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
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
      case 'PRESENT': return 'bg-[#34C759] shadow-sm';
      case 'ABSENT': return 'bg-[#FF3B30] shadow-sm';
      case 'LATE': return 'bg-[#FFCC00] shadow-sm';
      case 'EXCUSED': return 'bg-[#007AFF] shadow-sm';
      default: return 'bg-[#D1D5DB] shadow-sm';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'ABSENT': return 'Absent';
      case 'LATE': return 'Late';
      case 'EXCUSED': return 'Excused';
      default: return 'No Record';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleCellClick = (record: AttendanceRecord | null) => {
    if (record) {
      setSelectedRecord(record);
      setShowDetailModal(true);
    }
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
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Attendance Record</h2>
                <p className="text-sm text-gray-600">View your attendance history by subject</p>
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
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                    ).map((subject, subjectIndex) => (
                      <tr key={subject.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                        subjectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}>
                        <td className="sticky left-0 z-20 px-4 py-3 text-sm font-medium text-gray-900 border-r-2 border-gray-300 min-w-[160px] bg-gradient-to-r from-white via-white to-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="truncate font-semibold">{subject.name}</div>
                        </td>
                        {monthDays.map((day, dayIndex) => {
                          const record = getAttendanceForSubjectAndDate(subject.id, day);
                          
                          return (
                            <td 
                              key={day.toISOString()} 
                              className={`px-2 py-3 text-center border-r border-gray-100 min-w-[60px] ${
                                dayIndex % 7 === 5 || dayIndex % 7 === 6 ? 'bg-gray-50/50' : 'bg-white'
                              }`}
                            >
                              {record ? (
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCellClick(record)}
                                  className={`w-9 h-9 rounded-lg ${getStatusColor(record.status)} flex items-center justify-center transition-all duration-200 hover:shadow-lg mx-auto`}
                                  title={`Click to view details - ${getStatusText(record.status)}`}
                                >
                                  {getStatusIcon(record.status)}
                                </motion.button>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mx-auto">
                                  <span className="text-gray-400 text-xs">–</span>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {attendanceData.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No attendance records found for this period.</p>
          </div>
        )}

        {/* Legend */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Legend</h4>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#34C759] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700 font-medium">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FF3B30] flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700 font-medium">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FFCC00] flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700 font-medium">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#007AFF] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-700 font-medium">Excused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal (View Only) */}
      <AnimatePresence>
        {showDetailModal && selectedRecord && (
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
              <div className={`p-6 ${getStatusColor(selectedRecord.status)} text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(selectedRecord.status)}
                    <h3 className="text-xl font-bold">{getStatusText(selectedRecord.status)}</h3>
                  </div>
                  <Eye className="w-5 h-5" />
                </div>
                <p className="text-white/90 text-sm">View-only mode</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Subject</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">{selectedRecord.subject.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {format(new Date(selectedRecord.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Time</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {selectedRecord.timetable.startTime} - {selectedRecord.timetable.endTime}
                  </p>
                </div>
                
                {selectedRecord.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teacher's Comment</label>
                    <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedRecord.notes}
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

export default StudentAttendanceGrid;
