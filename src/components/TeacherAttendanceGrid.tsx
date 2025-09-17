"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, BookOpen, GraduationCap, Calendar, Filter } from 'lucide-react';
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
  timetable?: {
    id: string;
    startTime: string;
    endTime: string;
    subject: {
      name: string;
    };
    class: {
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

interface TeacherAttendanceGridProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
  refreshTrigger?: number;
}

const TeacherAttendanceGrid: React.FC<TeacherAttendanceGridProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches,
  refreshTrigger
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');
  const [editNotes, setEditNotes] = useState('');

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

  const fetchAttendanceData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear }),
        ...(selectedBranch && { branchId: selectedBranch })
      });

      const response = await fetch(`/api/attendance/history?${params}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Attendance API Response:', result);
        // The attendance history API returns data directly as an array
        const attendanceRecords = Array.isArray(result) ? result : [];
        console.log('Processed attendance records:', attendanceRecords);
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
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedBranch, currentDate, refreshTrigger]);

  const getAttendanceForStudentAndDate = (studentId: string, date: Date) => {
    if (!Array.isArray(attendanceData)) return [];
    return attendanceData.filter(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };


  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'PRESENT': return <span className="text-green-600 font-bold text-xs sm:text-sm">✓</span>;
      case 'ABSENT': return <span className="text-red-600 font-bold text-xs sm:text-sm">✗</span>;
      case 'LATE': return <span className="text-yellow-600 font-bold text-xs sm:text-sm">⏰</span>;
      case 'EXCUSED': return <span className="text-blue-600 font-bold text-xs sm:text-sm">E</span>;
      default: return <span className="text-gray-300 text-xs sm:text-sm">-</span>;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-50 border-green-200';
      case 'ABSENT': return 'bg-red-50 border-red-200';
      case 'LATE': return 'bg-yellow-50 border-yellow-200';
      case 'EXCUSED': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleEditAttendance = (attendance: any) => {
    setEditingAttendance(attendance);
    setEditStatus(attendance.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused');
    setEditNotes(attendance.notes || '');
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async () => {
    if (!editingAttendance) return;

    try {
      const response = await fetch('/api/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingAttendance.id,
          status: editStatus.toUpperCase(),
          notes: editNotes,
        }),
      });

      if (response.ok) {
        // Update local state
        setAttendanceData(prev => 
          prev.map(record => 
            record.id === editingAttendance.id 
              ? { ...record, status: editStatus.toUpperCase() as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', notes: editNotes }
              : record
          )
        );
        setShowEditModal(false);
        setEditingAttendance(null);
        setEditNotes('');
      } else {
        console.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateMonth('prev')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </motion.button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateMonth('next')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-200/50"
          >
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </motion.div>
        ) : selectedClass && selectedSubject ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[160px]">
                      Student
                    </th>
                    {monthDays.map(day => (
                      <th key={day.toISOString()} className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[40px]">
                        <div className="text-sm font-bold">{format(day, 'dd')}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">{format(day, 'EEE')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <motion.tr 
                      key={student.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[160px]">
                        <div className="font-semibold">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-gray-500 mt-1">{student.studentId}</div>
                      </td>
                      {monthDays.map(day => {
                        const attendanceRecords = getAttendanceForStudentAndDate(student.id, day);
                        return (
                          <td 
                            key={day.toISOString()} 
                            className="px-2 py-3 text-center border-r border-gray-200 min-w-[60px] group relative"
                          >
                            {attendanceRecords.length === 0 ? (
                              <div className="text-gray-300 text-xs sm:text-sm">-</div>
                            ) : (
                              <div className="space-y-1">
                                {attendanceRecords.map((attendance, recordIndex) => (
                                  <div
                                    key={`${attendance.id}-${recordIndex}`}
                                    className={`px-1 py-1 rounded text-xs cursor-pointer hover:shadow-md transition-colors ${getStatusColor(attendance.status)}`}
                                    title={attendance.notes ? `Comment: ${attendance.notes}` : 'Click to edit'}
                                    onClick={() => handleEditAttendance(attendance)}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {getStatusIcon(attendance.status)}
                                      {attendance.timetable && (
                                        <span className="text-xs text-gray-600">
                                          {formatDatabaseTime(attendance.timetable.startTime)}
                                        </span>
                                      )}
                                    </div>
                                    {attendance.notes && (
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 max-w-xs">
                                        <div className="font-medium">{attendance.status}</div>
                                        <div className="text-gray-300">{attendance.notes}</div>
                                        {attendance.timetable && (
                                          <div className="text-gray-400 text-xs">
                                            {formatDatabaseTime(attendance.timetable.startTime)} - {formatDatabaseTime(attendance.timetable.endTime)}
                                          </div>
                                        )}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span className="text-gray-700">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 font-bold">⏰</span>
                  <span className="text-gray-700">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">E</span>
                  <span className="text-gray-700">Excused</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">-</span>
                  <span className="text-gray-700">No Record</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">9:00 AM</span>
                  <span className="text-gray-700">Time</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">
                Multiple lessons on the same day are shown vertically with time indicators
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-gray-200/50"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Filters</h3>
            <p className="text-gray-600">Please select both a class and subject to view attendance history.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Attendance Modal */}
      <AnimatePresence>
        {showEditModal && editingAttendance && (
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
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Attendance</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {editingAttendance.student?.firstName} {editingAttendance.student?.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(editingAttendance.date), 'MMMM dd, yyyy')}
                  </p>
                  {editingAttendance.timetable && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDatabaseTime(editingAttendance.timetable.startTime)} - {formatDatabaseTime(editingAttendance.timetable.endTime)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'present' | 'absent' | 'late' | 'excused')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    placeholder="Add a comment about this student's attendance..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAttendance}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeacherAttendanceGrid;
