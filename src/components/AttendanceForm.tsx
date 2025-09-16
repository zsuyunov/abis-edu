"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
      const response = await fetch(
        `/api/attendance/students?classId=${lessonData.classId}&subjectId=${lessonData.subjectId}&branchId=${lessonData.branchId}&academicYearId=${lessonData.academicYearId}`,
        {
          headers: {
            'x-user-id': teacherId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('AttendanceForm - Students fetched:', data);
        
        // Handle different response structures
        const studentsData = data.data || data.students || data || [];
        console.log('AttendanceForm - Processed students data:', studentsData);
        console.log('AttendanceForm - Students count:', studentsData.length);
        
        if (studentsData.length === 0) {
          console.warn('AttendanceForm - No students found for class:', lessonData.classId);
          alert('❌ No students found for this class.\n\nPlease check if:\n• The class has students assigned\n• The class ID is correct\n• Students are active in the system');
          setStudents([]);
          setAttendance([]);
          return;
        }
        
        setStudents(studentsData);
        
        // Initialize attendance records
        const initialAttendance = studentsData.map((student: Student) => {
          // Use the numeric studentId field instead of the string id
          const studentId = student.studentId ? parseInt(student.studentId.replace('S', '')) : parseInt(student.id);
          const record = {
            studentId: studentId, // Use the numeric student ID
            status: 'present' as const,
            notes: ''
          };
          console.log('AttendanceForm - Created attendance record:', record);
          return record;
        });
        
        console.log('AttendanceForm - Initial attendance records:', initialAttendance);
        setAttendance(initialAttendance);
      } else {
        const errorData = await response.text();
        console.error('AttendanceForm - Error response:', errorData);
        console.error('AttendanceForm - Response status:', response.status);
        alert(`❌ Failed to fetch students:\n\nStatus: ${response.status}\nError: ${errorData}`);
        setStudents([]);
        setAttendance([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      alert(`💥 Error fetching students:\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
      setStudents([]);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId: string, field: 'status' | 'notes', value: string) => {
    const numericStudentId = parseInt(studentId.replace('S', ''));
    setAttendance(prev =>
      prev.map(record =>
        record.studentId === numericStudentId
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
      
      // Validate attendance data
      if (attendance.length === 0) {
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

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          timetableId: lessonData.id,
          classId: lessonData.classId,
          subjectId: lessonData.subjectId, // Added missing subjectId
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
                    const studentAttendance = attendance.find(a => a.studentId === parseInt(student.id));
                    
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
                                onClick={() => updateAttendance(student.id, 'status', status)}
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
                            onChange={(e) => updateAttendance(student.id, 'notes', e.target.value)}
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
