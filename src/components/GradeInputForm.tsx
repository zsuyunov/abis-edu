"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Users, BookOpen, Calendar } from 'lucide-react';
import { csrfFetch } from '@/hooks/useCsrfToken';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface GradeInputFormProps {
  isOpen: boolean;
  onClose: () => void;
  timetableId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  className: string;
  subjectName: string;
  onSave?: () => void;
}

interface GradeEntry {
  studentId: string;
  grade: number | null;
  notes?: string;
}

const GradeInputForm: React.FC<GradeInputFormProps> = ({
  isOpen,
  onClose,
  timetableId,
  classId,
  subjectId,
  teacherId,
  date,
  className,
  subjectName,
  onSave
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      fetchStudents();
      fetchExistingGrades();
    }
  }, [isOpen, classId, subjectId, date]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/students/by-class?classId=${classId}`);
      if (response.ok) {
        const result = await response.json();
        const students = result.success ? result.data : result;
        setStudents(students);
        
        // Initialize grades object
        const initialGrades: Record<string, GradeEntry> = {};
        students.forEach((student: Student) => {
          initialGrades[student.id] = {
            studentId: student.id,
            grade: null,
            notes: ''
          };
        });
        setGrades(initialGrades);
      } else {
        console.error('Failed to fetch students:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingGrades = async () => {
    try {
      const response = await fetch(
        `/api/grades?classId=${classId}&subjectId=${subjectId}&date=${date}`,
        {
          headers: {
            'x-user-id': teacherId,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const existingGrades = data.grades || [];
        const gradeMap: Record<string, GradeEntry> = {};
        
        existingGrades.forEach((grade: any) => {
          gradeMap[grade.studentId] = {
            studentId: grade.studentId,
            grade: grade.value || grade.grade,
            notes: grade.notes || ''
          };
        });
        
        setGrades(prev => ({ ...prev, ...gradeMap }));
      }
    } catch (error) {
      console.error('Error fetching existing grades:', error);
    }
  };

  const handleGradeChange = (studentId: string, grade: string) => {
    const numericGrade = grade === '' ? null : Math.min(100, Math.max(0, parseInt(grade) || 0));
    
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grade: numericGrade
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const gradeEntries = Object.values(grades).filter(entry => entry.grade !== null && entry.grade > 0);
      
      if (gradeEntries.length === 0) {
        alert('Please enter at least one grade with a score greater than 0.');
        return;
      }
      
      const response = await csrfFetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          grades: gradeEntries.map(entry => ({
            studentId: entry.studentId,
            value: entry.grade,
            notes: entry.notes,
            classId: parseInt(classId),
            subjectId: parseInt(subjectId),
            teacherId,
            date,
            academicYearId: 1, // Default - should be passed from timetable data
            branchId: 1 // Default - should be passed from timetable data
          }))
        }),
      });

      if (response.ok) {
        alert('Grades saved successfully!');
        onSave?.(); // Trigger refresh callback
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to save grades: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('An error occurred while saving grades. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Grade Input
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {className}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {subjectName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Found</h3>
              <p className="text-gray-500">No students are enrolled in this class.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Grade (1-100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={grades[student.id]?.grade || ''}
                      onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      placeholder="1-100"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={grades[student.id]?.notes || ''}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      className="w-48 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeInputForm;
