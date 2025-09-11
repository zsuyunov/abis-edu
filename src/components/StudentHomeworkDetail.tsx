"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Helper function for attachment icons
const getAttachmentIcon = (fileType: string, fileName?: string) => {
  if (!fileType && !fileName) return "📄";
  
  const type = (fileType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  
  // Check by file type first
  if (type.startsWith('image/')) return "🖼️";
  if (type.startsWith('video/')) return "🎥";
  if (type.startsWith('audio/') || name.includes('voice') || name.includes('audio')) return "🎤";
  if (type.includes('pdf')) return "📕";
  if (type.includes('word') || type.includes('document') || name.includes('.doc')) return "📝";
  if (type.includes('excel') || type.includes('spreadsheet') || name.includes('.xls')) return "📊";
  if (type.includes('powerpoint') || type.includes('presentation') || name.includes('.ppt')) return "📋";
  if (type.includes('text') || name.includes('.txt')) return "📄";
  
  // Check by file extension if type is not available
  if (name.includes('.jpg') || name.includes('.png') || name.includes('.gif') || name.includes('.jpeg')) return "🖼️";
  if (name.includes('.mp4') || name.includes('.avi') || name.includes('.mov')) return "🎥";
  if (name.includes('.mp3') || name.includes('.wav') || name.includes('.ogg') || name.includes('.m4a')) return "🎤";
  if (name.includes('.pdf')) return "📕";
  if (name.includes('.zip') || name.includes('.rar')) return "📦";
  
  return "📎";
};

// Attachment Viewer Component (same as TeacherHomeworkList)
const AttachmentViewer = ({ attachment }: { attachment: any }) => {
  const fileType = attachment.fileType || attachment.mimeType || '';
  let fileUrl = attachment.fileUrl || attachment.url || attachment.filePath || '';
  const fileName = attachment.fileName || attachment.originalName || 'Unknown file';
  
  // Construct proper file URL using the file serving API
  if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('data:') && !fileUrl.startsWith('/api/files/')) {
    const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
    fileUrl = `/api/files/${cleanPath}`;
  }
  
  if (!fileUrl) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-2">❌</div>
        <p className="text-gray-600">File URL not available</p>
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
          <p className="font-medium mb-2">Debug Info:</p>
          <pre>{JSON.stringify(attachment, null, 2)}</pre>
        </div>
      </div>
    );
  }
  
  if (fileType.startsWith('image/')) {
    return (
      <div className="text-center">
        <img 
          src={fileUrl} 
          alt={fileName}
          className="max-w-full max-h-96 object-contain mx-auto rounded-lg shadow-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling!.textContent = 'Failed to load image';
          }}
        />
        <div className="hidden text-red-500 py-4">Failed to load image</div>
        <div className="mt-3 text-sm text-gray-600">
          <p className="mb-2 font-medium">{fileName}</p>
          <a 
            href={fileUrl} 
            download={fileName}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            📥 Download
          </a>
        </div>
      </div>
    );
  }
  
  if (fileType.startsWith('video/')) {
    return (
      <div className="text-center">
        <video 
          controls 
          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
          preload="metadata"
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
            target.nextElementSibling!.textContent = 'Failed to load video';
          }}
        >
          <source src={fileUrl} type={fileType} />
          Your browser does not support the video tag.
        </video>
        <div className="hidden text-red-500 py-4">Failed to load video</div>
        <div className="mt-3 text-sm text-gray-600">
          <p className="mb-2 font-medium">{fileName}</p>
          <a 
            href={fileUrl} 
            download={fileName}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            📥 Download
          </a>
        </div>
      </div>
    );
  }
  
  if (fileType.startsWith('audio/') || fileName.toLowerCase().includes('voice') || fileName.toLowerCase().includes('audio')) {
    return (
      <div className="text-center">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8 mb-4 border border-purple-200">
          <div className="text-6xl mb-4">🎤</div>
          <p className="text-lg font-medium mb-4 text-purple-900">Voice Message</p>
          <audio 
            controls 
            className="w-full max-w-md mx-auto mb-4"
            preload="metadata"
            onError={(e) => {
              const target = e.target as HTMLAudioElement;
              target.style.display = 'none';
              const errorDiv = target.parentElement?.querySelector('.audio-error') as HTMLElement;
              if (errorDiv) {
                errorDiv.style.display = 'block';
              }
            }}
          >
            <source src={fileUrl} type={fileType || 'audio/mpeg'} />
            <source src={fileUrl} type="audio/wav" />
            <source src={fileUrl} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
          <div className="audio-error hidden text-red-500 py-4 bg-red-50 rounded-md border border-red-200">
            <p>⚠️ Failed to load audio file</p>
            <p className="text-xs mt-1">Try downloading the file to play it locally</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p className="mb-2 font-medium">{fileName}</p>
          <a 
            href={fileUrl} 
            download={fileName}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            📥 Download
          </a>
        </div>
      </div>
    );
  }
  
  if (fileType.includes('pdf')) {
    return (
      <div className="text-center">
        <div className="bg-gray-100 rounded-lg p-8 mb-4">
          <div className="text-6xl mb-4">📕</div>
          <p className="text-lg font-medium mb-2">{fileName}</p>
          <p className="text-sm text-gray-600 mb-4">PDF Document</p>
          <div className="flex gap-2 justify-center">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              👁️ View PDF
            </a>
            <a 
              href={fileUrl} 
              download={fileName}
              className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              📥 Download
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Default file viewer
  return (
    <div className="text-center">
      <div className="bg-gray-100 rounded-lg p-8 mb-4">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg font-medium mb-2">{fileName}</p>
        <p className="text-sm text-gray-600 mb-4">{fileType || 'Unknown file type'}</p>
        <div className="flex gap-2 justify-center">
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            👁️ View File
          </a>
          <a 
            href={fileUrl} 
            download={fileName}
            className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            📥 Download
          </a>
        </div>
      </div>
    </div>
  );
};

interface StudentHomeworkDetailProps {
  homeworkId: number;
  studentId: string;
  onClose: () => void;
  onSubmit: (homeworkId: number) => void;
}

const StudentHomeworkDetail = ({
  homeworkId,
  studentId,
  onClose,
  onSubmit,
}: StudentHomeworkDetailProps) => {
  const [homework, setHomework] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [attachmentModal, setAttachmentModal] = useState(false);

  useEffect(() => {
    fetchHomeworkDetails();
  }, [homeworkId]);

  const fetchHomeworkDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-homework/submit?homeworkId=${homeworkId}`, {
        headers: {
          'x-user-id': studentId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch homework details');
      }

      const data = await response.json();
      setHomework(data.homework);
      setSubmission(data.submission);
    } catch (error) {
      console.error('Error fetching homework details:', error);
      setError('Failed to load homework details');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentView = (attachment: any) => {
    setSelectedAttachment(attachment);
    setAttachmentModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "MISSED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "✅";
      case "LATE":
        return "⏰";
      case "MISSED":
        return "❌";
      case "PENDING":
        return "📝";
      default:
        return "📚";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">📚</div>
            <div className="text-gray-600">Loading homework details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!homework) return null;

  const now = new Date();
  const dueDate = new Date(homework.dueDate);
  const isOverdue = now > dueDate;
  const hasSubmission = submission && submission.status !== "NOT_SUBMITTED";

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{homework.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Image src="/subject.png" alt="Subject" width={16} height={16} />
                    <span>{homework.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image src="/teacher.png" alt="Teacher" width={16} height={16} />
                    <span>{homework.teacher.firstName} {homework.teacher.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image src="/class.png" alt="Class" width={16} height={16} />
                    <span>{homework.class.name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Due Date and Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/calendar.png" alt="Due Date" width={16} height={16} />
                    <span className="text-sm font-medium text-blue-900">Due Date:</span>
                    <span className="text-sm text-blue-800">
                      {new Date(homework.dueDate).toLocaleDateString()} at {new Date(homework.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image src="/date.png" alt="Assigned" width={16} height={16} />
                    <span className="text-sm font-medium text-blue-900">Assigned:</span>
                    <span className="text-sm text-blue-800">{new Date(homework.assignedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  {isOverdue ? (
                    <div className="text-red-600 font-medium">
                      <div className="text-lg">⏰ Overdue</div>
                      <div className="text-sm">
                        {Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </div>
                    </div>
                  ) : (
                    <div className="text-green-600 font-medium">
                      <div className="text-lg">⏳ Time Left</div>
                      <div className="text-sm">
                        {Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {homework.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{homework.description}</p>
              </div>
            )}

            {/* Instructions */}
            {homework.instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
                <p className="text-blue-800">{homework.instructions}</p>
              </div>
            )}

            {/* Points */}
            {homework.totalPoints && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-purple-100 text-purple-800 text-sm font-medium">
                  🎯 Total Points: {homework.totalPoints}
                </span>
                {homework.allowLateSubmission && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-orange-100 text-orange-800 text-sm">
                    ⚠️ Late submission allowed
                  </span>
                )}
              </div>
            )}

            {/* Teacher Attachments */}
            {homework.attachments && homework.attachments.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  📎 Teacher Attachments ({homework.attachments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {homework.attachments.map((attachment: any, index: number) => {
                    // Construct proper file URL
                    let fileUrl = attachment.fileUrl || attachment.url || attachment.filePath || '';
                    if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('data:') && !fileUrl.startsWith('/api/files/')) {
                      const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
                      fileUrl = `/api/files/${cleanPath}`;
                    }
                    
                    return (
                      <button
                        key={attachment.id || index}
                        onClick={() => handleAttachmentView({...attachment, fileUrl})}
                        className="flex items-center gap-3 p-3 bg-white border border-green-200 rounded-lg hover:shadow-md transition-all duration-200 text-left"
                      >
                        <div className="text-2xl">
                          {getAttachmentIcon(attachment.fileType || attachment.mimeType, attachment.fileName || attachment.originalName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.originalName || attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.fileType || 'File'} • {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="text-green-600">
                          👁️
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Student Submission Status */}
            {hasSubmission && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                  ✅ Your Submission
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-green-900">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)} {submission.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-green-900">Submitted:</span>
                    <span className="text-green-800">
                      {new Date(submission.submissionDate).toLocaleDateString()} at {new Date(submission.submissionDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  {submission.isLate && (
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ This was a late submission
                    </div>
                  )}
                  
                  {submission.content && (
                    <div>
                      <span className="text-sm font-medium text-green-900">Your Response:</span>
                      <p className="text-sm text-green-800 mt-1 bg-white p-3 rounded border">{submission.content}</p>
                    </div>
                  )}
                  
                  {submission.grade !== null && submission.grade !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-green-900">Grade:</span>
                      <span className={`px-3 py-1 rounded font-medium ${
                        submission.grade >= 90 ? "bg-green-200 text-green-800" :
                        submission.grade >= 70 ? "bg-blue-200 text-blue-800" :
                        submission.grade >= 50 ? "bg-yellow-200 text-yellow-800" :
                        "bg-red-200 text-red-800"
                      }`}>
                        {submission.grade}%
                      </span>
                    </div>
                  )}
                  
                  {submission.feedback && (
                    <div>
                      <span className="text-sm font-medium text-green-900">Teacher Feedback:</span>
                      <p className="text-sm text-green-800 mt-1 bg-white p-3 rounded border">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              
              <div className="flex items-center gap-3">
                {(!hasSubmission || (submission && submission.status !== "GRADED")) && (
                  <button
                    onClick={() => onSubmit && onSubmit(homework.id)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Submit Homework
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Modal */}
      {attachmentModal && selectedAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAttachment.originalName || selectedAttachment.fileName}
                </h3>
                <button
                  onClick={() => setAttachmentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <AttachmentViewer attachment={selectedAttachment} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentHomeworkDetail;
