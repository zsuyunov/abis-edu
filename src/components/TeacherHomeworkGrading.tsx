"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

// Define interfaces for better type safety
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  fileType: 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'OTHER';
  mimeType: string;
  duration?: number;
}

interface Submission {
  id: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  submissionDate: string;
  isLate: boolean;
  student: Student;
  attachments: Attachment[];
}

interface Homework {
  id: number;
  title: string;
  subject: {
    name: string;
  };
  totalPoints: number;
}

interface TeacherHomeworkGradingProps {
  teacherId: string;
  homeworkId: number | null;
  onBack: () => void;
}

const TeacherHomeworkGrading: React.FC<TeacherHomeworkGradingProps> = ({
  teacherId,
  homeworkId,
  onBack,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (homeworkId) {
      fetchHomeworkSubmissions();
    }
  }, [homeworkId]);

  const fetchHomeworkSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher-homework/submissions?homeworkId=${homeworkId}&view=individual`, {
        headers: {
          'x-user-id': teacherId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework);
        
        // Transform studentsWithSubmissions to submissions array
        if (data.studentsWithSubmissions) {
          const transformedSubmissions = data.studentsWithSubmissions
            .filter((studentData: any) => studentData.submission && studentData.submission.status !== 'NOT_SUBMITTED')
            .map((studentData: any) => ({
              ...studentData.submission,
              student: {
                id: studentData.id,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                studentId: studentData.studentId,
              }
            }));
          setSubmissions(transformedSubmissions);
        } else {
          setSubmissions(data.submissions || []);
        }
      } else {
        console.error('Failed to fetch homework submissions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching homework submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSelect = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedback(submission.feedback || "");
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      setGrading(true);
      const response = await fetch("/api/teacher-homework/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacherId,
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          grade: parseFloat(grade),
          feedback: feedback.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message || "Grade saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        await fetchHomeworkSubmissions();
        setSelectedSubmission(null);
        setGrade("");
        setFeedback("");
      } else {
        const error = await response.json();
        console.error("Grading error:", error);
        alert(`Failed to grade submission: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("An error occurred while grading. Please try again.");
    } finally {
      setGrading(false);
    }
  };

  const getSubmissionStatusColor = (submission: Submission) => {
    if (submission.grade !== null && submission.grade !== undefined) {
      return "bg-green-100 text-green-800";
    }
    if (submission.isLate) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-blue-100 text-blue-800";
  };

  const getSubmissionStatusText = (submission: Submission) => {
    if (submission.grade !== null && submission.grade !== undefined) {
      return `${t('homework.graded')} (${submission.grade}%)`;
    }
    if (submission.isLate) {
      return t('homework.lateSubmission');
    }
    return t('homework.pendingReview');
  };

  if (!homeworkId) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('homework.selectHomework')}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          {t('homework.selectHomeworkDesc')}
        </p>
      </div>
    );
  }

  if (loading && !homework) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="animate-spin text-3xl sm:text-4xl mb-3 sm:mb-4">📚</div>
        <div className="text-sm sm:text-base text-gray-600">{t('homework.loadingSubmissions')}</div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">❌</div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('homework.notFound')}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          {t('homework.notFoundDesc')}
        </p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded-md hover:bg-blue-600 transition-colors"
        >
          {t('common.backToList')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 shadow-lg">
      {/* Success Message */}
      {successMessage && (
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Image src="/grade.png" alt="Grade" width={16} height={16} className="invert sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{homework.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{homework.subject.name} • {submissions.length} {t('homework.submission')}{submissions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            <Image src="/close.png" alt="Close" width={20} height={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] sm:max-h-[800px] overflow-y-auto">
        {/* STUDENT SUBMISSIONS GRID */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
          {submissions.length > 0 ? (
            submissions.map((submission: any) => (
              <div key={submission.id} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200">
                {/* Student Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                      {submission.student?.firstName?.[0] || ''}{submission.student?.lastName?.[0] || ''}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                        {submission.student?.firstName || ''} {submission.student?.lastName || ''}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {t('homework.studentId')}: {submission.student?.studentId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getSubmissionStatusColor(submission)}`}>
                      {getSubmissionStatusText(submission)}
                    </span>
                    {submission.grade !== null && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                        {t('homework.grade')}: {submission.grade}/{homework?.totalPoints || 100}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {/* Left Column - Content */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Submission Text */}
                    {submission.content && (
                      <div className="bg-white rounded-lg p-3 sm:p-4 border">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 flex items-center gap-1 sm:gap-2">
                          📝 {t('homework.submissionText')}
                        </h4>
                        <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap max-h-32 sm:max-h-40 overflow-y-auto">
                          {submission.content}
                        </div>
                      </div>
                    )}

                    {/* Submission Info */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">📊 {t('homework.submissionInfo')}</h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-600 truncate">{t('homework.submitted')}:</span>
                          <span className="font-medium text-right">
                            {submission.submissionDate ? new Date(submission.submissionDate).toLocaleDateString() : t('homework.notSubmitted')}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-600 truncate">{t('homework.time')}:</span>
                          <span className="font-medium text-right">
                            {submission.submissionDate ? new Date(submission.submissionDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-600 truncate">{t('homework.status')}:</span>
                          <span className={`font-medium text-right ${submission.isLate ? 'text-red-600' : 'text-green-600'}`}>
                            {submission.isLate ? t('homework.lateSubmission') : t('homework.onTime')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Attachments & Grading */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Attachments */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                        📎 {t('homework.attachments')} ({submission.attachments?.length || 0})
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {submission.attachments && submission.attachments.length > 0 ? (
                          submission.attachments.map((attachment: any, index: number) => (
                            <div key={index} className="border rounded-lg p-2 sm:p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex-shrink-0">
                                  {attachment.fileType === 'IMAGE' && (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-sm">
                                      🖼️
                                    </div>
                                  )}
                                  {attachment.fileType === 'DOCUMENT' && (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center text-sm">
                                      📄
                                    </div>
                                  )}
                                  {attachment.fileType === 'AUDIO' && (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center text-sm">
                                      🎵
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                    {attachment.originalName || attachment.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : ''}
                                    {attachment.duration && ` • ${Math.round(attachment.duration)}s`}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => window.open(attachment.fileUrl, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex-shrink-0"
                                >
                                  {t('homework.view')}
                                </button>
                              </div>
                              
                              {attachment.fileType === 'IMAGE' && (
                                <div className="mt-2 sm:mt-3">
                                  <img 
                                    src={attachment.fileUrl} 
                                    alt={attachment.originalName}
                                    className="max-w-full h-24 sm:h-32 object-cover rounded border"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              
                              {attachment.fileType === 'AUDIO' && (
                                <div className="mt-2 sm:mt-3">
                                  <audio controls className="w-full h-8 sm:h-10">
                                    <source src={attachment.fileUrl} type={attachment.mimeType} />
                                    {t('homework.audioNotSupported')}
                                  </audio>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">{t('homework.noAttachments')}</p>
                        )}
                      </div>
                    </div>

                    {/* Grading Section */}
                    <div className="bg-white rounded-lg p-3 sm:p-4 border">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                        ⭐ {t('homework.gradeSubmission')}
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {t('homework.gradeOutOf')} {homework?.totalPoints || 100}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={homework?.totalPoints || 100}
                            value={selectedSubmission?.id === submission.id ? grade : submission.grade?.toString() || ''}
                            onChange={(e) => {
                              if (selectedSubmission?.id !== submission.id) {
                                handleSubmissionSelect(submission);
                              }
                              setGrade(e.target.value);
                            }}
                            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('homework.enterGrade')}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {t('homework.feedback')}
                          </label>
                          <textarea
                            rows={2}
                            value={selectedSubmission?.id === submission.id ? feedback : submission.feedback || ''}
                            onChange={(e) => {
                              if (selectedSubmission?.id !== submission.id) {
                                handleSubmissionSelect(submission);
                              }
                              setFeedback(e.target.value);
                            }}
                            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder={t('homework.enterFeedback')}
                          />
                        </div>
                        <button
                          onClick={() => {
                            if(selectedSubmission?.id !== submission.id) {
                              handleSubmissionSelect(submission);
                            }
                            handleGradeSubmission();
                          }}
                          disabled={grading}
                          className="w-full bg-blue-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {grading && selectedSubmission?.id === submission.id ? t('homework.saving') : t('homework.saveGradeFeedback')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 sm:py-12 px-4">
              <div className="text-gray-400 text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t('homework.noSubmissions')}</h3>
              <p className="text-sm sm:text-base text-gray-500">{t('homework.noSubmissionsDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHomeworkGrading;
