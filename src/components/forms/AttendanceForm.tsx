"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle, Users, BookOpen, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface AttendanceFormProps {
  type?: string;
  data?: any;
  setOpen: (open: boolean) => void;
  onSave?: () => void;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}

const AttendanceForm = ({ type, data, setOpen, onSave }: AttendanceFormProps) => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      fetchStudents();
    }
  }, [data]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('Attendance Form Data:', data);
      
      const apiUrl = `/api/attendance/students?classId=${data?.classId}&subjectId=${data?.subjectId}&branchId=${data?.branchId}&academicYearId=${data?.academicYearId}`;
      console.log('Fetching students from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'x-user-id': data?.teacherId || '',
        },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        const studentsData = responseData.data || responseData.students || responseData || [];
        console.log('Students data:', studentsData);
        
        setStudents(studentsData);
        
        // Initialize attendance records
        const initialAttendance = studentsData.map((student: Student) => ({
          studentId: student.id,
          status: 'present' as const,
          notes: ''
        }));
        setAttendance(initialAttendance);
      } else {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        setStudents([]);
        setAttendance([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, field: 'status' | 'notes', value: string) => {
    setAttendance(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  const markAllAs = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => 
      prev.map(record => ({ ...record, status }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': data?.teacherId || '',
        },
        body: JSON.stringify({
          timetableId: data?.id,
          classId: data?.classId,
          subjectId: data?.subjectId,
          academicYearId: data?.academicYearId,
          branchId: data?.branchId,
          date: data?.date,
          attendanceData: attendance
        }),
      });

      if (response.ok) {
        alert('Attendance saved successfully!');
        onSave?.(); // Trigger refresh callback
        setOpen(false);
      } else {
        const error = await response.json();
        alert(`Failed to save attendance: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('An error occurred while saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 truncate">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
{t('attendance.take_attendance')}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center gap-1 truncate">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{data?.className}</span>
              </span>
              <span className="flex items-center gap-1 truncate">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{data?.subjectName}</span>
              </span>
              <span className="flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{data?.date ? new Date(data.date).toLocaleDateString() : t('common.no_date')}</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 sm:h-48 md:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">{t('attendance.quickActions')}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
                <button
                  onClick={() => markAllAs('present')}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs sm:text-sm"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('attendance.markAllPresent')}</span>
                  <span className="sm:hidden">{t('attendance.present')}</span>
                </button>
                <button
                  onClick={() => markAllAs('absent')}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-xs sm:text-sm"
                >
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('attendance.markAllAbsent')}</span>
                  <span className="sm:hidden">{t('attendance.absent')}</span>
                </button>
                <button
                  onClick={() => markAllAs('late')}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-xs sm:text-sm"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('attendance.markAllLate')}</span>
                  <span className="sm:hidden">{t('attendance.late')}</span>
                </button>
                <button
                  onClick={() => markAllAs('excused')}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-xs sm:text-sm"
                >
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('attendance.markAllExcused')}</span>
                  <span className="sm:hidden">{t('attendance.excused')}</span>
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students found for this class.</p>
                  <p className="text-sm text-gray-400">
                    Class ID: {data?.classId}, Subject ID: {data?.subjectId}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {students.map((student, index) => {
                    const studentAttendance = attendance.find(a => a.studentId === student.id);
                    
                    return (
                      <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Student ID: {student.id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                            {getStatusIcon(studentAttendance?.status || 'present')}
                            <span className="capitalize">
                              {studentAttendance?.status || 'present'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Status Selection */}
                          <div className="grid grid-cols-4 gap-2">
                            {['present', 'late', 'excused', 'absent'].map((status) => (
                              <button
                                key={status}
                                onClick={() => updateAttendance(student.id, 'status', status)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  studentAttendance?.status === status
                                    ? status === 'present' ? 'bg-blue-600 text-white shadow-lg scale-105'
                                      : status === 'late' ? 'bg-yellow-600 text-white shadow-lg scale-105'
                                      : status === 'excused' ? 'bg-green-600 text-white shadow-lg scale-105'
                                      : 'bg-red-600 text-white shadow-lg scale-105'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="capitalize hidden sm:inline">{status}</span>
                              </button>
                            ))}
                          </div>
                          
                          {/* Notes */}
                          <input
                            type="text"
                            placeholder="Add notes (optional)"
                            value={studentAttendance?.notes || ''}
                            onChange={(e) => updateAttendance(student.id, 'notes', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
