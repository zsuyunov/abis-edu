"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { csrfFetch } from '@/hooks/useCsrfToken';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}
 
interface AttendanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: {
    id: string;
    classId: string;
    subjectId: string;
    academicYearId: string;
    branchId: string;
    className: string;
    subjectName: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  teacherId: string;
}

interface AttendanceRecord {
  studentId: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  isOpen,
  onClose,
  lessonData,
  teacherId,
}) => {
  console.log('AttendanceForm - Component mounted with:', { isOpen, lessonData, teacherId });

  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && lessonData) {
      console.log('AttendanceForm - useEffect triggered:', { isOpen, lessonData });
      fetchStudents();
    }
  }, [isOpen, lessonData]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('AttendanceForm - Fetching students with lessonData:', lessonData);
      console.log('AttendanceForm - Teacher ID:', teacherId);
      
      // First, fetch students
      const studentsApiUrl = `/api/attendance/students?classId=${lessonData.classId}&subjectId=${lessonData.subjectId}&branchId=${lessonData.branchId}&academicYearId=${lessonData.academicYearId}`;
      console.log('AttendanceForm - Students API URL:', studentsApiUrl);
      
      const studentsResponse = await fetch(studentsApiUrl, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      if (!studentsResponse.ok) {
        const errorData = await studentsResponse.text();
        console.error('AttendanceForm - Students API Error:', errorData);
        alert(`❌ Failed to fetch students:\n\nStatus: ${studentsResponse.status}\nError: ${errorData}`);
        setStudents([]);
        setAttendance([]);
        return;
      }

      const studentsData = await studentsResponse.json();
      const students = studentsData.data || studentsData.students || studentsData || [];
      console.log('AttendanceForm - Students fetched:', students.length);
      
      if (students.length === 0) {
          console.warn('AttendanceForm - No students found for class:', lessonData.classId);
          alert('❌ No students found for this class.\n\nPlease check if:\n• The class has students assigned\n• The class ID is correct\n• Students are active in the system');
          setStudents([]);
          setAttendance([]);
          return;
        }
        
      setStudents(students);

      // Now fetch existing attendance data for this specific lesson
      const attendanceApiUrl = `/api/attendance/lesson?timetableId=${lessonData.id}&date=${lessonData.date}`;
      console.log('AttendanceForm - Attendance API URL:', attendanceApiUrl);
      console.log('AttendanceForm - Lesson Data:', lessonData);
      
      const attendanceResponse = await fetch(attendanceApiUrl, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      let existingAttendance: any[] = [];
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        existingAttendance = attendanceData.data || [];
        console.log('AttendanceForm - Existing attendance fetched:', existingAttendance.length);
        console.log('AttendanceForm - Existing attendance data:', existingAttendance);
      } else {
        console.log('AttendanceForm - No existing attendance found for this lesson');
        console.log('AttendanceForm - Response status:', attendanceResponse.status);
        const errorText = await attendanceResponse.text();
        console.log('AttendanceForm - Error response:', errorText);
      }

      // Create attendance records, pre-populating with existing data if available
      const initialAttendance = students.map((student: Student) => {
        // Use the original studentId string format for consistency
        const studentIdString = student.studentId || student.id;
        const studentIdNumeric = student.studentId ? parseInt(student.studentId.replace('S', '')) : parseInt(student.id);
        
        // Look for existing attendance record for this student
        const existingRecord = existingAttendance.find(record => 
          record.studentId === studentIdString
        );
        
        if (existingRecord) {
          console.log('AttendanceForm - Found existing record for student:', studentIdString, existingRecord);
          return {
            studentId: studentIdNumeric, // Use numeric for internal processing
            status: existingRecord.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused',
            notes: existingRecord.notes || ''
          };
        } else {
          // No existing record, use defaults
          return {
            studentId: studentIdNumeric, // Use numeric for internal processing
            status: 'present' as const,
            notes: ''
          };
        }
        });
        
        console.log('AttendanceForm - Initial attendance records:', initialAttendance);
        setAttendance(initialAttendance);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`💥 Error fetching data:\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
      setStudents([]);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, field: 'status' | 'notes', value: string) => {
    console.log('AttendanceForm - updateAttendance called:', { studentId, field, value });
    const numericStudentId = parseInt(studentId.replace('S', ''));
    console.log('AttendanceForm - Converted studentId:', numericStudentId);
    console.log('AttendanceForm - Current attendance state before update:', attendance);
    
    setAttendance(prev => {
      const updated = prev.map(record => {
        if (record.studentId === numericStudentId) {
          console.log('AttendanceForm - Updating record for student:', numericStudentId, 'field:', field, 'value:', value);
          return { ...record, [field]: value };
        }
        return record;
      });
      console.log('AttendanceForm - Updated attendance state:', updated);
      return updated;
    });
  };

  const markAllAs = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => 
      prev.map(record => ({ ...record, status }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('AttendanceForm - handleSave called');
      console.log('AttendanceForm - Current attendance state:', attendance);
      console.log('AttendanceForm - Students state:', students);
      
      // Validate attendance data
      if (attendance.length === 0) {
        console.log('AttendanceForm - No attendance records found');
        alert('❌ No attendance records to save. Please mark attendance for at least one student.');
        return;
      }

      console.log('Saving attendance with data:', {
        timetableId: lessonData.id,
        classId: lessonData.classId,
        subjectId: lessonData.subjectId,
        date: lessonData.date,
        attendance: attendance
      });

      const response = await csrfFetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          classId: parseInt(lessonData.classId),
          subjectId: parseInt(lessonData.subjectId),
          date: lessonData.date,
          attendance: attendance
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success popup
        alert(`✅ Success! Attendance saved successfully!\n\n📊 Saved ${result.savedRecords || attendance.length} attendance records`);
        onClose();
      } else {
        // Error popup with details
        const errorMessage = result.details 
          ? `❌ Failed to save attendance:\n\n${result.error}\n\nDetails: ${result.details}`
          : `❌ Failed to save attendance:\n\n${result.error || 'Unknown error'}`;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Attendance save error:', error);
      alert('💥 An error occurred while saving attendance.\n\nPlease check your internet connection and try again.');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('attendance.takeAttendance')}</h2>
              <p className="text-blue-100 mt-1">
                {lessonData.subjectName} - {lessonData.className}
              </p>
              <p className="text-blue-200 text-sm">
                {new Date(lessonData.date).toLocaleDateString()} • {lessonData.startTime} - {lessonData.endTime}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('attendance.loading')}</p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('attendance.quickActions')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => markAllAs('present')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
{t('attendance.markAllPresent')}
                  </button>
                  <button
                    onClick={() => markAllAs('absent')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
{t('attendance.markAllAbsent')}
                  </button>
                  <button
                    onClick={() => markAllAs('late')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
{t('attendance.markAllLate')}
                  </button>
                  <button
                    onClick={() => markAllAs('excused')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
{t('attendance.markAllExcused')}
                  </button>
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {students.map((student) => {
                    const studentIdNumeric = student.studentId ? parseInt(student.studentId.replace('S', '')) : parseInt(student.id);
                    const studentAttendance = attendance.find(a => a.studentId === studentIdNumeric);
                    
                    return (
                      <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(studentAttendance?.status || 'present')}
                            <span className="text-sm font-medium capitalize">
                              {studentAttendance?.status || 'present'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          {/* Status Selection */}
                          <div className="flex gap-2">
                            {['present', 'late', 'excused', 'absent'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  const studentId = student.studentId || student.id;
                                  updateAttendance(studentId, 'status', status);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  studentAttendance?.status === status
                                    ? status === 'present' ? 'bg-blue-600 text-white'
                                      : status === 'late' ? 'bg-yellow-600 text-white'
                                      : status === 'excused' ? 'bg-green-600 text-white'
                                      : 'bg-red-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="capitalize">{status}</span>
                              </button>
                            ))}
                          </div>
                          
                          {/* Notes */}
                          <input
                            type="text"
                            placeholder="Add notes (optional)"
                            value={studentAttendance?.notes || ''}
                            onChange={(e) => {
                              const studentId = student.studentId || student.id;
                              updateAttendance(studentId, 'notes', e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
{t('attendance.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
{saving ? t('attendance.saving') : t('attendance.saveAttendance')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
