"use client";

import { useState, useEffect } from "react";
import { X, Save, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface GradeModalProps {
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

interface GradeRecord {
  studentId: string;
  score: number;
  feedback: string;
}

const GradeModal: React.FC<GradeModalProps> = ({
  isOpen,
  onClose,
  lessonData,
  teacherId,
}) => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gradeType, setGradeType] = useState('DAILY_GRADE');
  const [maxScore, setMaxScore] = useState(100);
  const [assignmentTitle, setAssignmentTitle] = useState('');

  useEffect(() => {
    if (isOpen && lessonData) {
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
        console.log('GradeModal - Students fetched:', data);
        
        // Handle different response structures
        const studentsData = data.data || data.students || data || [];
        console.log('GradeModal - Processed students data:', studentsData);
        console.log('GradeModal - Students count:', studentsData.length);
        
        if (studentsData.length === 0) {
          console.warn('GradeModal - No students found for class:', lessonData.classId);
        }
        
        setStudents(studentsData);
        
        // Initialize grade records
        const initialGrades = studentsData.map((student: Student) => ({
          studentId: student.id,
          score: 0,
          feedback: ''
        }));
        setGrades(initialGrades);
      } else {
        const errorData = await response.text();
        console.error('GradeModal - Error response:', errorData);
        console.error('GradeModal - Response status:', response.status);
        setStudents([]);
        setGrades([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      alert('Failed to fetch students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = (studentId: string, field: 'score' | 'feedback', value: string | number) => {
    setGrades(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  const setAllScores = (score: number) => {
    setGrades(prev => 
      prev.map(record => ({ ...record, score }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Filter out grades with 0 scores unless explicitly set
      const validGrades = grades.filter(grade => grade.score > 0);
      
      if (validGrades.length === 0) {
        alert('Please enter at least one grade before saving.');
        return;
      }

      const response = await fetch('/api/teacher-grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify({
          timetableId: lessonData.id,
          branchId: lessonData.branchId,
          academicYearId: lessonData.academicYearId,
          classId: lessonData.classId,
          subjectId: lessonData.subjectId,
          type: gradeType,
          date: lessonData.date,
          maxScore: maxScore,
          assignmentTitle: assignmentTitle || `${lessonData.subjectName} - ${new Date(lessonData.date).toLocaleDateString()}`,
          records: validGrades
        }),
      });

      if (response.ok) {
        alert('Grades saved successfully!');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enter Grades</h2>
              <p className="text-green-100 mt-1">
                {lessonData.subjectName} - {lessonData.className}
              </p>
              <p className="text-green-200 text-sm">
                {new Date(lessonData.date).toLocaleDateString()} • {lessonData.startTime} - {lessonData.endTime}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600">Loading students...</p>
            </div>
          ) : (
            <>
              {/* Grade Settings */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Title
                    </label>
                    <input
                      type="text"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      placeholder="Enter assignment title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Type
                    </label>
                    <select
                      value={gradeType}
                      onChange={(e) => setGradeType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="DAILY_GRADE">Daily Grade</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="TEST">Test</option>
                      <option value="MIDTERM">Midterm</option>
                      <option value="FINAL">Final</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Score
                    </label>
                    <input
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                      min="1"
                      max="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAllScores(maxScore)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Set All to Max ({maxScore})
                  </button>
                  <button
                    onClick={() => setAllScores(Math.floor(maxScore * 0.8))}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Set All to 80% ({Math.floor(maxScore * 0.8)})
                  </button>
                  <button
                    onClick={() => setAllScores(Math.floor(maxScore * 0.6))}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Set All to 60% ({Math.floor(maxScore * 0.6)})
                  </button>
                  <button
                    onClick={() => setAllScores(0)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Student Grades */}
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {students.map((student) => {
                    const studentGrade = grades.find(g => g.studentId === student.id);
                    
                    return (
                      <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                            <span className="text-sm text-gray-500 ml-2">({student.studentId})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Score: {studentGrade?.score || 0}/{maxScore}
                            </span>
                            {studentGrade?.score && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {Math.round((studentGrade.score / maxScore) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Score Input */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Score</label>
                            <input
                              type="number"
                              value={studentGrade?.score || ''}
                              onChange={(e) => updateGrade(student.id, 'score', parseFloat(e.target.value) || 0)}
                              min="0"
                              max={maxScore}
                              step="0.5"
                              placeholder={`0 - ${maxScore}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* Feedback */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Feedback (Optional)</label>
                            <input
                              type="text"
                              value={studentGrade?.feedback || ''}
                              onChange={(e) => updateGrade(student.id, 'feedback', e.target.value)}
                              placeholder="Add feedback..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Summary</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Students:</span>
                    <span className="font-semibold ml-2">{students.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Graded:</span>
                    <span className="font-semibold ml-2">{grades.filter(g => g.score > 0).length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Average:</span>
                    <span className="font-semibold ml-2">
                      {grades.filter(g => g.score > 0).length > 0 
                        ? Math.round(grades.filter(g => g.score > 0).reduce((sum, g) => sum + g.score, 0) / grades.filter(g => g.score > 0).length)
                        : 0
                      }/{maxScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pass Rate:</span>
                    <span className="font-semibold ml-2">
                      {grades.filter(g => g.score > 0).length > 0 
                        ? Math.round((grades.filter(g => g.score >= maxScore * 0.6).length / grades.filter(g => g.score > 0).length) * 100)
                        : 0
                      }%
                    </span>
                  </div>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradeModal;
