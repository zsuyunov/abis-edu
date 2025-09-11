"use client";

import { useState } from "react";
import Image from "next/image";

// Helper function for attachment icons (moved up for accessibility)
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

// Attachment Viewer Component
const AttachmentViewer = ({ attachment }: { attachment: any }) => {
  // Handle multiple attachments
  if (attachment.fileType === 'multiple' && attachment.attachments) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">All Attachments ({attachment.attachments.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachment.attachments.map((att: any, index: number) => (
            <div key={att.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">
                  {getAttachmentIcon(att.fileType || att.mimeType, att.fileName || att.originalName)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{att.fileName || att.originalName}</p>
                  <p className="text-xs text-gray-500">{att.fileType || 'Unknown type'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = att.fileUrl || att.url || att.filePath || '';
                    let finalUrl = url;
                    if (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:') && !url.startsWith('/api/files/')) {
                      const cleanPath = url.replace(/^\/+/, '').replace(/^uploads\//, '');
                      finalUrl = `/api/files/${cleanPath}`;
                    }
                    window.open(finalUrl, '_blank');
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  View
                </button>
                <button
                  onClick={() => {
                    const url = att.fileUrl || att.url || att.filePath || '';
                    let finalUrl = url;
                    if (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:') && !url.startsWith('/api/files/')) {
                      const cleanPath = url.replace(/^\/+/, '').replace(/^uploads\//, '');
                      finalUrl = `/api/files/${cleanPath}`;
                    }
                    const link = document.createElement('a');
                    link.href = finalUrl;
                    link.download = att.fileName || att.originalName || 'download';
                    link.click();
                  }}
                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              onError={(e) => {
                console.error('PDF view error:', e);
                alert('Unable to view PDF. Please try downloading it instead.');
              }}
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

interface TeacherHomeworkListProps {
  teacherId: string;
  homeworkData: any;
  loading: boolean;
  onHomeworkSelect?: (homeworkId: number) => void;
  onDataUpdate: (data: any) => void;
  onHomeworkEdit?: (homeworkId: number) => void;
  onHomeworkAction?: (homeworkId: number, action: 'archive' | 'restore' | 'delete') => void;
  onHomeworkGrading?: (homeworkId: number) => void;
}

const TeacherHomeworkList = ({
  teacherId,
  homeworkData,
  loading,
  onHomeworkSelect,
  onDataUpdate,
  onHomeworkEdit,
  onHomeworkAction,
  onHomeworkGrading,
}: TeacherHomeworkListProps) => {
  const [selectedHomework, setSelectedHomework] = useState<number | null>(null);
  const [attachmentModal, setAttachmentModal] = useState<{isOpen: boolean, attachment: any}>({isOpen: false, attachment: null});
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: string, homeworkId: number | null, title: string}>({
    isOpen: false, 
    action: '', 
    homeworkId: null, 
    title: ''
  });
  const [successMessage, setSuccessMessage] = useState("");


  const handleAttachmentView = (attachment: any) => {
    setAttachmentModal({isOpen: true, attachment});
  };

  const closeAttachmentModal = () => {
    setAttachmentModal({isOpen: false, attachment: null});
  };

  const handleActionClick = (homeworkId: number, action: 'archive' | 'restore' | 'delete', title: string) => {
    setConfirmModal({
      isOpen: true,
      action,
      homeworkId,
      title
    });
  };

  const confirmAction = async () => {
    if (confirmModal.homeworkId && onHomeworkAction) {
      try {
        await onHomeworkAction(confirmModal.homeworkId, confirmModal.action as 'archive' | 'restore' | 'delete');
        setSuccessMessage(`Homework "${confirmModal.title}" ${confirmModal.action}d successfully!`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        console.error('Action failed:', error);
      }
    }
    setConfirmModal({isOpen: false, action: '', homeworkId: null, title: ''});
  };

  const cancelAction = () => {
    setConfirmModal({isOpen: false, action: '', homeworkId: null, title: ''});
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'archive': return '📦';
      case 'restore': return '♻️';
      case 'delete': return '🗑️';
      default: return '❓';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'archive': return 'text-orange-600 hover:text-orange-800';
      case 'restore': return 'text-green-600 hover:text-green-800';
      case 'delete': return 'text-red-600 hover:text-red-800';
      default: return 'text-gray-600 hover:text-gray-800';
    }
  };

  // Progress calculation functions
  const calculateTimeLeft = (submissionDate: string) => {
    const now = new Date();
    const deadline = new Date(submissionDate);
    const timeDiff = deadline.getTime() - now.getTime();
    
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
    const minutes = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
    
    return { days, hours, minutes, totalMs: timeDiff };
  };

  const getProgressStatus = (submissionDate: string, status: string) => {
    const timeLeft = calculateTimeLeft(submissionDate);
    
    if (status === 'EXPIRED' || timeLeft.totalMs < 0) {
      return { 
        status: 'expired', 
        timeLeft: { days: Math.abs(timeLeft.days), hours: Math.abs(timeLeft.hours), minutes: Math.abs(timeLeft.minutes) }, 
        color: 'text-red-600', 
        bgColor: 'bg-red-100' 
      };
    } else if (timeLeft.days === 0 && timeLeft.hours <= 24) {
      return { 
        status: 'due_today', 
        timeLeft, 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100' 
      };
    } else if (timeLeft.days <= 3) {
      return { 
        status: 'urgent', 
        timeLeft, 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100' 
      };
    } else if (timeLeft.days <= 7) {
      return { 
        status: 'soon', 
        timeLeft, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100' 
      };
    } else {
      return { 
        status: 'normal', 
        timeLeft, 
        color: 'text-green-600', 
        bgColor: 'bg-green-100' 
      };
    }
  };

  const getProgressText = (progressInfo: any) => {
    const { status, timeLeft } = progressInfo;
    
    switch (status) {
      case 'expired':
        if (timeLeft.days > 0) {
          return `Expired ${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''} ago`;
        } else {
          return `Expired ${timeLeft.hours}h ${timeLeft.minutes}m ago`;
        }
      case 'due_today':
        return `Due in ${timeLeft.hours}h ${timeLeft.minutes}m`;
      case 'urgent':
        if (timeLeft.days > 0) {
          return `${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''} ${timeLeft.hours}h left`;
        } else {
          return `${timeLeft.hours}h ${timeLeft.minutes}m left`;
        }
      case 'soon':
        return `${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''} ${timeLeft.hours}h left`;
      case 'normal':
        return `${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''} left`;
      default:
        return '';
    }
  };

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'expired': return '⏰';
      case 'due_today': return '🚨';
      case 'urgent': return '⚠️';
      case 'soon': return '📅';
      case 'normal': return '✅';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📚</div>
        <div className="text-gray-600">Loading homework assignments...</div>
      </div>
    );
  }

  const homework = homeworkData.homework || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "✅";
      case "EXPIRED":
        return "⏰";
      case "ARCHIVED":
        return "📦";
      default:
        return "📚";
    }
  };

  if (homework.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Homework Assignments</h3>
        <p className="text-gray-600 mb-4">
          You haven't created any homework assignments yet. Start by creating your first homework.
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
          💡 <strong>Tip:</strong> Use the "Create Homework" tab to design engaging assignments with multimedia content.
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Success Message */}
    {successMessage && (
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      </div>
    )}

    <div className="space-y-4">
      {homework.map((hw: any) => (
        <div
          key={hw.id}
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hw.status)}`}>
                  {getStatusIcon(hw.status)} {hw.status}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/subject.png" alt="Subject" width={16} height={16} />
                    <span>{hw.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/class.png" alt="Class" width={16} height={16} />
                    <span>{hw.class.name}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/date.png" alt="Assigned" width={16} height={16} />
                    <span>Assigned: {new Date(hw.assignedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/calendar.png" alt="Due" width={16} height={16} />
                    <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {hw.description && (
                <p className="mt-3 text-sm text-gray-600">{hw.description}</p>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {hw.dueDate && (
            <div className="mb-4">
              {(() => {
                const progressInfo = getProgressStatus(hw.dueDate, hw.status);
                return (
                  <div className={`${progressInfo.bgColor} rounded-lg p-3 border-l-4 ${progressInfo.color.replace('text-', 'border-')}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getProgressIcon(progressInfo.status)}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${progressInfo.color}`}>
                          {getProgressText(progressInfo)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Due: {new Date(hw.dueDate).toLocaleDateString()} at {new Date(hw.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                      {progressInfo.status !== 'expired' && progressInfo.timeLeft.days <= 7 && (
                        <div className="text-right">
                          <div className={`text-sm font-bold ${progressInfo.color}`}>
                            {progressInfo.timeLeft.days}d {progressInfo.timeLeft.hours}h
                          </div>
                          <div className="text-xs text-gray-500">
                            remaining
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Statistics */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-4 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{hw.stats.totalStudents}</div>
                <div className="text-xs text-gray-600">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{hw.stats.submittedCount}</div>
                <div className="text-xs text-gray-600">Submitted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{hw.stats.lateCount}</div>
                <div className="text-xs text-gray-600">Late</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{hw.stats.gradedCount}</div>
                <div className="text-xs text-gray-600">Graded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{hw.stats.submissionRate}%</div>
                <div className="text-xs text-gray-600">Submission Rate</div>
              </div>
            </div>
          </div>


          {/* Attachments Section */}
          {hw.attachments && hw.attachments.length > 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-600 font-semibold text-sm">📎 Attachments ({hw.attachments.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {hw.attachments.map((attachment: any, index: number) => {
                  // Enhanced URL construction
                  let fileUrl = attachment.fileUrl || attachment.url || attachment.filePath || '';
                  
                  // Construct proper URL using the file serving API
                  if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('data:') && !fileUrl.startsWith('/api/files/')) {
                    // Remove /uploads/ prefix and construct API URL
                    const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
                    fileUrl = `/api/files/${cleanPath}`;
                  }
                  
                  return (
                    <button
                      key={attachment.id || index}
                      onClick={() => handleAttachmentView({...attachment, fileUrl})}
                      className="flex flex-col items-center gap-2 p-3 bg-white border-2 border-blue-200 hover:border-blue-400 rounded-lg transition-all duration-200 hover:shadow-md group"
                      title={`${attachment.fileName || attachment.originalName || 'Attachment'} - Click to view`}
                    >
                      <div className="text-3xl group-hover:scale-110 transition-transform">
                        {getAttachmentIcon(attachment.fileType || attachment.mimeType, attachment.fileName || attachment.originalName)}
                      </div>
                      <div className="text-xs text-center text-gray-700 font-medium truncate w-full">
                        {attachment.fileName || attachment.originalName || 'Unknown'}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {attachment.fileType || attachment.mimeType || 'File'}
                      </div>
                      {attachment.fileSize && (
                        <div className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-2">📎</div>
                <div className="text-sm">No attachments</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {hw.totalPoints && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                  🎯 {hw.totalPoints} points
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onHomeworkEdit && onHomeworkEdit(hw.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 hover:shadow-md text-sm font-medium"
              >
                ✏️ Edit
              </button>
              
              <button 
                onClick={() => onHomeworkGrading && onHomeworkGrading(hw.id)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 hover:shadow-md text-sm font-medium"
              >
                📊 Grade
              </button>
              
              {/* Archive/Restore Button */}
              {hw.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleActionClick(hw.id, 'archive', hw.title)}
                  className="px-3 py-2 border border-orange-300 text-orange-600 rounded-md hover:bg-orange-50 transition-colors text-sm"
                  title="Archive homework"
                >
                  📦
                </button>
              ) : (
                <button
                  onClick={() => handleActionClick(hw.id, 'restore', hw.title)}
                  className="px-3 py-2 border border-green-300 text-green-600 rounded-md hover:bg-green-50 transition-colors text-sm"
                  title="Restore homework"
                >
                  ♻️
                </button>
              )}
              
              {/* Delete Button */}
              <button
                onClick={() => handleActionClick(hw.id, 'delete', hw.title)}
                className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm"
                title="Delete homework"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Attachment Modal */}
    {attachmentModal.isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {attachmentModal.attachment?.fileName || attachmentModal.attachment?.originalName || 'Attachment'}
            </h3>
            <button
              onClick={closeAttachmentModal}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            {attachmentModal.attachment && (
              <AttachmentViewer attachment={attachmentModal.attachment} />
            )}
          </div>
        </div>
      </div>
    )}

    {/* Confirmation Modal */}
    {confirmModal.isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{getActionIcon(confirmModal.action)}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmModal.action === 'archive' && 'Archive Homework'}
                  {confirmModal.action === 'restore' && 'Restore Homework'}
                  {confirmModal.action === 'delete' && 'Delete Homework'}
                </h3>
                <p className="text-sm text-gray-600">
                  {confirmModal.action === 'archive' && 'This will make the homework inactive but keep all data.'}
                  {confirmModal.action === 'restore' && 'This will make the homework active again.'}
                  {confirmModal.action === 'delete' && 'This action cannot be undone. All data will be permanently removed.'}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{confirmModal.title}</p>
            </div>

            {confirmModal.action === 'delete' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Warning:</strong> If this homework has submissions, it cannot be deleted. Consider archiving instead.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelAction}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-md transition-colors ${
                  confirmModal.action === 'delete' 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : confirmModal.action === 'archive'
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {confirmModal.action === 'archive' && 'Archive'}
                {confirmModal.action === 'restore' && 'Restore'}
                {confirmModal.action === 'delete' && 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default TeacherHomeworkList;
