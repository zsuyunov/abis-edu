"use client";

import { useState, useEffect, useRef } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import Image from "next/image";

interface StudentHomeworkSubmissionProps {
  studentId: string;
  selectedHomeworkId: number | null;
  onSubmissionComplete: () => void;
  onCancel: () => void;
  isMobile: boolean;
}

const StudentHomeworkSubmission = ({
  studentId,
  selectedHomeworkId,
  onSubmissionComplete,
  onCancel,
  isMobile,
}: StudentHomeworkSubmissionProps) => {
  const [loading, setLoading] = useState(false);
  const [homework, setHomework] = useState<any>(null);
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEditMode, setShowEditMode] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedHomeworkId) {
      fetchHomeworkDetails();
    }
  }, [selectedHomeworkId]);

  const fetchHomeworkDetails = async () => {
    try {
      setLoading(true);
      const response = await csrfFetch(`/api/student-homework/submit?homeworkId=${selectedHomeworkId}`, {
        headers: {
          'x-user-id': studentId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework);
        setSubmissionDetails(data.submissionDetails);
        setSubmissionContent(data.submission?.content || "");
      } else {
        const error = await response.json();
        console.error("Error fetching homework details:", error);
      }
    } catch (error) {
      console.error("Error fetching homework details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          return false;
        }
        // Check file type
        const allowedTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'];
        const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
        if (!isAllowed) {
          alert(`File ${file.name} is not supported. Please upload images, PDFs, Word documents, or text files.`);
          return false;
        }
        return true;
      });
      
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadAttachments = async () => {
    if (attachments.length === 0) return [];
    
    setUploading(true);
    const uploadedFiles = [];
    
    for (const file of attachments) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'homework_submission');
      
      try {
        const response = await csrfFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          uploadedFiles.push({
            fileName: file.name,
            fileUrl: result.fileUrl,
            fileSize: file.size,
            fileType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT'
          });
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
    
    setUploading(false);
    return uploadedFiles;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('homeworkId', selectedHomeworkId?.toString() || '');
      formData.append('content', submissionContent);
      
      // Add files
      attachments.forEach((file) => {
        formData.append('files', file);
      });

      // Add voice recording if exists
      if (audioBlob) {
        const audioFile = new File([audioBlob], `voice_recording_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        formData.append('files', audioFile);
      }
      
      const response = await csrfFetch("/api/student-homework/submit", {
        method: "POST",
        headers: {
          "x-user-id": studentId,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || "Homework submitted successfully!");
        onSubmissionComplete();
      } else {
        const error = await response.json();
        console.error("Submission error:", error);
        alert(`Failed to submit homework: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error submitting homework:", error);
      alert("An error occurred while submitting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion of submission content
  const handleDeleteSubmissionContent = async (type: 'text') => {
    if (!selectedHomeworkId) return;
    
    try {
      const response = await csrfFetch(`/api/student-homework/submit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': studentId,
        },
        body: JSON.stringify({
          homeworkId: selectedHomeworkId,
          action: 'deleteContent',
          contentType: type,
        }),
      });

      if (response.ok) {
        fetchHomeworkDetails(); // Refresh the submission details
        alert('Content removed successfully');
      } else {
        alert('Failed to remove content');
      }
    } catch (error) {
      console.error('Error removing content:', error);
      alert('Error removing content');
    }
  };

  // Handle deletion of attachments
  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!selectedHomeworkId) return;
    
    try {
      const response = await csrfFetch(`/api/student-homework/submit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': studentId,
        },
        body: JSON.stringify({
          homeworkId: selectedHomeworkId,
          action: 'deleteAttachment',
          attachmentId: attachmentId,
        }),
      });

      if (response.ok) {
        fetchHomeworkDetails(); // Refresh the submission details
        alert('Attachment removed successfully');
      } else {
        alert('Failed to remove attachment');
      }
    } catch (error) {
      console.error('Error removing attachment:', error);
      alert('Error removing attachment');
    }
  };

  if (!selectedHomeworkId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Homework</h3>
        <p className="text-gray-600 mb-4">
          Choose a homework assignment to view details and submit your work.
        </p>
      </div>
    );
  }

  if (loading && !homework) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📝</div>
        <div className="text-gray-600">Loading homework details...</div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Homework Not Found</h3>
        <p className="text-gray-600 mb-4">
          The selected homework assignment could not be found.
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/assignment.png" alt="Assignment" width={20} height={20} className="invert" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{homework.title}</h3>
              <p className="text-sm text-gray-600">{homework.subject.name} • {homework.teacher.firstName} {homework.teacher.lastName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Image src="/close.png" alt="Close" width={24} height={24} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* HOMEWORK DETAILS */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📋</span>
            Assignment Details
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/date.png" alt="Assigned" width={16} height={16} />
                <span><strong>Assigned:</strong> {new Date(homework.assignedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/calendar.png" alt="Due" width={16} height={16} />
                <span><strong>Due:</strong> {new Date(homework.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              {homework.totalPoints && (
                <div className="flex items-center gap-2 mb-2">
                  <span>🎯</span>
                  <span><strong>Points:</strong> {homework.totalPoints}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span>⏰</span>
                <span><strong>Time Left:</strong> {submissionDetails?.timeUntilDue || "Calculating..."}</span>
              </div>
            </div>
          </div>

          {homework.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Description:</h5>
              <p className="text-sm text-gray-600">{homework.description}</p>
            </div>
          )}

          {homework.instructions && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h5>
              <p className="text-sm text-blue-800">{homework.instructions}</p>
            </div>
          )}

          {/* TEACHER ATTACHMENTS */}
          {homework.attachments && homework.attachments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Teacher Attachments:</h5>
              <div className="space-y-2">
                {homework.attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">
                      {attachment.fileType === "IMAGE" ? "🖼️" :
                       attachment.fileType === "DOCUMENT" ? "📄" :
                       attachment.fileType === "AUDIO" ? "🎵" :
                       attachment.fileType === "VIDEO" ? "🎬" :
                       attachment.fileType === "LINK" ? "🔗" : "📎"}
                    </span>
                    <a
                      href={(() => {
                        let fileUrl = attachment.fileUrl || attachment.url || attachment.filePath || '';
                        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('data:') && !fileUrl.startsWith('/api/files/')) {
                          const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
                          fileUrl = `/api/files/${cleanPath}`;
                        }
                        return fileUrl;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {attachment.originalName}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EXISTING SUBMISSION DISPLAY */}
        {submissionDetails?.hasSubmission && submissionDetails.submission?.submissionDate && new Date(submissionDetails.submission.submissionDate).getTime() > 0 && (
          <div className="bg-green-50 p-4 rounded-md space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-green-900">Your Current Submission</h4>
              <div className="flex items-center gap-4 text-sm">
                <span><strong>Submitted:</strong> {new Date(submissionDetails.submission.submissionDate).toLocaleDateString()}</span>
                <span><strong>Status:</strong> {submissionDetails.submissionStatus}</span>
                {submissionDetails.submission?.grade !== null && submissionDetails.submission?.grade !== undefined && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded"><strong>Grade:</strong> {submissionDetails.submission.grade}%</span>
                )}
              </div>
            </div>

            {/* SUBMITTED TEXT CONTENT */}
            {submissionDetails.submission?.content && (
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Submitted Text Content</h5>
                  <button
                    onClick={() => handleDeleteSubmissionContent('text')}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                  >
                    Remove Text
                  </button>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap text-sm max-h-32 overflow-y-auto">
                  {submissionDetails.submission.content}
                </div>
              </div>
            )}

            {/* SUBMITTED VOICE RECORDINGS */}
            {submissionDetails.submission?.attachments?.filter((att: any) => att.fileType === 'AUDIO' || att.mimeType?.startsWith('audio/')).map((audioAttachment: any) => (
              <div key={audioAttachment.id} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900 flex items-center gap-2">
                    <span>🎵</span>
                    Submitted Voice Recording
                  </h5>
                  <button
                    onClick={() => handleDeleteAttachment(audioAttachment.id)}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                  >
                    Remove Audio
                  </button>
                </div>
                <audio controls className="w-full">
                  <source src={(() => {
                    let fileUrl = audioAttachment.fileUrl;
                    if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('/api/files/')) {
                      const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
                      fileUrl = `/api/files/${cleanPath}`;
                    }
                    return fileUrl;
                  })()} type={audioAttachment.mimeType} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}

            {/* SUBMITTED FILES AND IMAGES */}
            {submissionDetails.submission?.attachments?.filter((att: any) => att.fileType !== 'AUDIO' && !att.mimeType?.startsWith('audio/')).map((attachment: any) => (
              <div key={attachment.id} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {attachment.fileType === 'IMAGE' ? '🖼️' : '📄'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{attachment.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={(() => {
                        let fileUrl = attachment.fileUrl;
                        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('/api/files/')) {
                          const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
                          fileUrl = `/api/files/${cleanPath}`;
                        }
                        return fileUrl;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                    >
                      {attachment.fileType === 'IMAGE' ? 'View' : 'Download'}
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {submissionDetails.submission?.feedback && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-900">Teacher Feedback:</p>
                <p className="mt-1 text-blue-800">{submissionDetails.submission.feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* SUBMISSION FORM */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📝</span>
            {submissionDetails?.hasSubmission ? 'Update Your Submission' : 'Your Submission'}
          </h4>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                id="content"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your homework content here..."
              />
            </div>

            {/* VOICE RECORDING */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Message
              </label>
              
              {!audioBlob ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <span>🎤</span>
                      Start Recording
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-red-600">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Recording: {formatTime(recordingTime)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Stop Recording
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-green-600">🎵</span>
                      <div>
                        <p className="text-sm font-medium text-green-900">Voice Recording</p>
                        <p className="text-xs text-green-700">Duration: {formatTime(recordingTime)}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <audio 
                          controls 
                          className="w-full"
                          preload="metadata"
                          style={{ minHeight: '40px' }}
                        >
                          <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          Delete Recording
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FILE ATTACHMENTS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Attachments (Images, Documents)
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">
                    <Image src="/upload.png" alt="Upload" width={48} height={48} className="mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600 text-sm mb-1">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-gray-500 text-xs">
                    Supported: Images, PDF, Word documents, Text files (Max 10MB each)
                  </p>
                </label>
              </div>

              {/* UPLOADED FILES LIST */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h6 className="text-sm font-medium text-gray-700">Selected Files:</h6>
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {file.type.startsWith('image/') ? '🖼️' : '📄'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>

        {/* SUBMISSION STATUS */}
        {!submissionDetails?.canSubmit && (
          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="font-medium text-yellow-900 mb-2">Submission Status</h4>
            <p className="text-sm text-yellow-800">
              {submissionDetails?.isOverdue && !homework.allowLateSubmission
                ? "Deadline has passed and late submissions are not allowed."
                : submissionDetails?.hasSubmission && submissionDetails?.submissionStatus === "GRADED"
                ? "This homework has been graded and cannot be resubmitted."
                : "This homework is not accepting submissions at this time."}
            </p>
          </div>
        )}

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
          
          {submissionDetails?.canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={loading || uploading || (!submissionContent.trim() && attachments.length === 0 && !audioBlob)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all duration-200 hover:shadow-lg font-medium"
            >
              {loading ? "Updating..." : submissionDetails?.hasSubmission ? "Update Submission" : "Submit Homework"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHomeworkSubmission;
