"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  Star, 
  Save, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap
} from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface Submission {
  id: number;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  textResponse: string | null;
  attachments: any[];
  student: Student;
}

interface Homework {
  id: number;
  title: string;
  description: string;
  fullMark: number;
  passingMark: number;
  dueDate: string;
  class: { id: number; name: string };
  subject: { id: number; name: string };
  submissions: Submission[];
}

interface HomeworkGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework;
  onGradeUpdate: () => void;
}

const HomeworkGradingModal = ({ isOpen, onClose, homework, onGradeUpdate }: HomeworkGradingModalProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({
    grade: "",
    feedback: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && homework) {
      fetchSubmissions();
    }
  }, [isOpen, homework]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/homework/${homework.id}/grade`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.homework.submissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade?.toString() || "",
      feedback: submission.feedback || ""
    });
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !gradeForm.grade) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/homework/${homework.id}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          grade: parseFloat(gradeForm.grade),
          feedback: gradeForm.feedback
        })
      });

      if (response.ok) {
        await fetchSubmissions();
        setSelectedSubmission(null);
        setGradeForm({ grade: "", feedback: "" });
        onGradeUpdate();
      }
    } catch (error) {
      console.error("Error saving grade:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'GRADED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeColor = (grade: number, fullMark: number, passingMark: number) => {
    const percentage = (grade / fullMark) * 100;
    const passingPercentage = (passingMark / fullMark) * 100;
    
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= passingPercentage) return 'text-blue-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* Left Panel - Student List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Grade Submissions</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{homework.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{homework.class.name} - {homework.subject.name}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Full Mark: {homework.fullMark}</span>
                <span>Passing: {homework.passingMark}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => submission.status === 'SUBMITTED' || submission.grade !== null ? handleViewSubmission(submission) : null}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedSubmission?.id === submission.id
                        ? 'border-blue-500 bg-blue-50'
                        : submission.status === 'PENDING'
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {submission.student.firstName} {submission.student.lastName}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        submission.grade !== null ? getStatusColor('GRADED') : getStatusColor(submission.status)
                      }`}>
                        {submission.grade !== null ? 'GRADED' : submission.status}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      ID: {submission.student.studentId}
                    </div>
                    
                    {submission.grade !== null && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                        <span className={`font-bold ${getGradeColor(submission.grade, homework.fullMark, homework.passingMark)}`}>
                          {submission.grade}/{homework.fullMark}
                        </span>
                      </div>
                    )}
                    
                    {submission.submittedAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(submission.submittedAt).toLocaleString()}
                      </div>
                    )}
                    
                    {submission.status === 'PENDING' && (
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        No submission yet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Submission Details & Grading */}
        <div className="flex-1 flex flex-col">
          {selectedSubmission ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">Student ID: {selectedSubmission.student.studentId}</p>
                  </div>
                  {selectedSubmission.submittedAt && (
                    <div className="text-sm text-gray-500">
                      Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Student Response */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Student Response
                  </h4>
                  
                  {selectedSubmission.textResponse ? (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{selectedSubmission.textResponse}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center text-gray-500">
                      No text response provided
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Attachments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedSubmission.attachments.map((attachment: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center gap-2">
                            {attachment.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                            {attachment.type === 'document' && <FileText className="w-4 h-4 text-purple-500" />}
                            {attachment.type === 'voice' && <Mic className="w-4 h-4 text-green-500" />}
                            <span className="text-sm text-gray-700 truncate">{attachment.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grading Section */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    Grade Assignment
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade (out of {homework.fullMark})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={homework.fullMark}
                        step="0.5"
                        value={gradeForm.grade}
                        onChange={(e) => setGradeForm(prev => ({ ...prev, grade: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter grade"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        <div>Passing Mark: {homework.passingMark}</div>
                        {gradeForm.grade && (
                          <div className={`font-medium ${
                            parseFloat(gradeForm.grade) >= homework.passingMark ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(gradeForm.grade) >= homework.passingMark ? 'PASS' : 'FAIL'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={gradeForm.feedback}
                      onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      placeholder="Provide feedback to the student..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveGrade}
                      disabled={!gradeForm.grade || saving}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Grade
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Submission</h3>
                <p className="text-gray-600">
                  Choose a student submission from the left panel to view details and assign grades
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkGradingModal;
