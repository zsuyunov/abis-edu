"use client";

import React, { useState, useEffect } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Eye, CheckCircle, Clock, FileText, Mic, Image, Play, Pause, Download, X, Star, MessageSquare } from 'lucide-react';

interface Student {
  id: string;
  fullName: string;
  email: string;
  isGraded: boolean;
  grade?: number;
  feedback?: string;
  submittedAt?: string;
}

interface Submission {
  id: string;
  studentId: string;
  homeworkId: string;
  content: string;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    originalName: string;
    fileSize: number;
  }>;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  isGraded: boolean;
}

interface HomeworkGradingPageProps {
  homeworkId: string;
  homeworkTitle: string;
  className: string;
  subjectName: string;
  onBack: () => void;
}

const HomeworkGradingPage: React.FC<HomeworkGradingPageProps> = ({
  homeworkId,
  homeworkTitle,
  className,
  subjectName,
  onBack
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Grade and feedback form
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    fetchStudentsAndSubmissions();
  }, [homeworkId]);

  const fetchStudentsAndSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch students and submissions
      const response = await csrfFetch(`/api/homework-grading?homeworkId=${homeworkId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setStudents(data.students);
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load students and submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (student: Student) => {
    setSelectedStudent(student);
    const submission = submissions.find(sub => sub.studentId === student.id);
    setSelectedSubmission(submission || null);
    
    // Set current grade and feedback if already graded
    if (submission?.isGraded) {
      setGrade(submission.grade || 0);
      setFeedback(submission.feedback || '');
    } else {
      setGrade(0);
      setFeedback('');
    }
  };

  const handleSubmitGrade = async () => {
    if (!selectedStudent || !selectedSubmission) return;
    
    if (grade < 0 || grade > 100) {
      alert('Grade must be between 0 and 100');
      return;
    }

    try {
      setSubmittingGrade(true);
      
      const response = await csrfFetch('/api/homework-grading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          grade: grade,
          feedback: feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit grade');
      }

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, grade, feedback, isGraded: true }
          : sub
      ));
      
      setStudents(prev => prev.map(student => 
        student.id === selectedStudent.id 
          ? { ...student, grade, feedback, isGraded: true }
          : student
      ));

      alert('Grade and feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting grade:', error);
      alert('Failed to submit grade. Please try again.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleAudioPlay = (fileUrl: string) => {
    console.log('🎵 Audio play clicked:', fileUrl);
    if (playingAudio === fileUrl) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(fileUrl);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return <Image className="w-4 h-4" />;
      case 'AUDIO':
        return <Mic className="w-4 h-4" />;
      case 'DOCUMENT':
      case 'TEXT':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFileColor = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return 'text-green-600 bg-green-100';
      case 'AUDIO':
        return 'text-purple-600 bg-purple-100';
      case 'DOCUMENT':
      case 'TEXT':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students and submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Grade Homework</h1>
                <p className="text-sm text-gray-600">{homeworkTitle} - {className} ({subjectName})</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{students.length} students</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Students</h2>
              <p className="text-sm text-gray-600">Click view to see submission details</p>
            </div>
            <div className="divide-y">
              {students.map((student) => (
                <motion.div
                  key={student.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {student.isGraded && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Graded</span>
                        </div>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewSubmission(student)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="View Submission"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-white rounded-lg shadow-sm border">
            {selectedStudent ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedStudent.fullName}'s Submission
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedSubmission ? 'Submitted' : 'No submission yet'}
                  </p>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedSubmission ? (
                    <div className="space-y-4">
                      {/* Submission Content */}
                      {selectedSubmission.content && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Submission Text</h3>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {selectedSubmission.content}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Attachments */}
                      {selectedSubmission.attachments.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Attachments</h3>
                          <div className="space-y-2">
                            {selectedSubmission.attachments.map((attachment) => (
                              <motion.div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${getFileColor(attachment.fileType)}`}>
                                    {getFileIcon(attachment.fileType)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {attachment.originalName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {attachment.fileType === 'IMAGE' && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => setPreviewImage(attachment.fileUrl)}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      title="Preview Image"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                  {attachment.fileType === 'AUDIO' && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleAudioPlay(attachment.fileUrl)}
                                      className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                      title="Play Audio"
                                    >
                                      {playingAudio === attachment.fileUrl ? (
                                        <Pause className="w-4 h-4" />
                                      ) : (
                                        <Play className="w-4 h-4" />
                                      )}
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDownload(attachment.fileUrl, attachment.originalName)}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Download File"
                                  >
                                    <Download className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio Player */}
                      {selectedSubmission.attachments.some(att => att.fileType === 'AUDIO' && playingAudio === att.fileUrl) && (
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-purple-600">Playing Audio</div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setPlayingAudio(null)}
                              className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <audio
                            controls
                            className="w-full h-8"
                            onEnded={() => setPlayingAudio(null)}
                            onError={() => setPlayingAudio(null)}
                          >
                            <source src={playingAudio || ''} type="audio/webm" />
                            <source src={playingAudio || ''} type="audio/mp3" />
                            <source src={playingAudio || ''} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}

                      {/* Grade and Feedback Form */}
                      <div className="border-t pt-4">
                        <h3 className="font-medium text-gray-900 mb-4">Grade & Feedback</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Grade (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={grade}
                              onChange={(e) => setGrade(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter grade"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Feedback
                            </label>
                            <textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter feedback for the student"
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmitGrade}
                            disabled={submittingGrade}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                              submittingGrade
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {submittingGrade ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                <span>Submitting...</span>
                              </div>
                            ) : (
                              'Submit Grade & Feedback'
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No submission yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a student to view their submission</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 text-gray-600 rounded-full hover:bg-opacity-100"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeworkGradingPage;
