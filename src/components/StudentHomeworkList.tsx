"use client";

import { useState } from "react";
import Image from "next/image";

interface StudentHomeworkListProps {
  studentId: string;
  homeworkData: any;
  loading: boolean;
  onHomeworkSelect: (homeworkId: number) => void;
  onDataUpdate: (data: any) => void;
}

const StudentHomeworkList = ({
  studentId,
  homeworkData,
  loading,
  onHomeworkSelect,
  onDataUpdate,
}: StudentHomeworkListProps) => {
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📚</div>
        <div className="text-gray-600">Loading your homework assignments...</div>
      </div>
    );
  }

  const homework = homeworkData.homework || [];
  
  console.log('StudentHomeworkList - homeworkData:', homeworkData);
  console.log('StudentHomeworkList - homework array:', homework);
  console.log('StudentHomeworkList - homework length:', homework.length);

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

  // Progress calculation functions (similar to teacher view)
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
    
    if (status === 'MISSED' || timeLeft.totalMs < 0) {
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
          return `Overdue by ${timeLeft.days} day${timeLeft.days !== 1 ? 's' : ''}`;
        } else {
          return `Overdue by ${timeLeft.hours}h ${timeLeft.minutes}m`;
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

  const getPriorityColor = (daysUntilDue: number, status: string) => {
    if (status === "COMPLETED" || status === "LATE" || status === "MISSED") {
      return "";
    }
    
    if (daysUntilDue < 0) return "border-red-500";
    if (daysUntilDue <= 1) return "border-orange-500";
    if (daysUntilDue <= 3) return "border-yellow-500";
    return "border-blue-500";
  };

  const filteredHomework = homework.filter((hw: any) => {
    if (selectedFilter === "ALL") return true;
    return hw.submissionStatus === selectedFilter;
  });

  // Group homework by status for better organization
  const groupedHomework = {
    PENDING: filteredHomework.filter((hw: any) => hw.submissionStatus === "PENDING"),
    COMPLETED: filteredHomework.filter((hw: any) => hw.submissionStatus === "COMPLETED"),
    LATE: filteredHomework.filter((hw: any) => hw.submissionStatus === "LATE"),
    MISSED: filteredHomework.filter((hw: any) => hw.submissionStatus === "MISSED"),
  };

  if (homework.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Homework Assignments</h3>
        <p className="text-gray-600 mb-4">
          You don't have any homework assignments yet. Check back later!
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
          💡 <strong>Tip:</strong> Homework assignments will appear here once your teachers assign them.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATUS FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {["ALL", "PENDING", "COMPLETED", "LATE", "MISSED"].map((status) => {
          const count = status === "ALL" ? homework.length : groupedHomework[status as keyof typeof groupedHomework]?.length || 0;
          return (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFilter === status
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* HOMEWORK CARDS */}
      <div className="space-y-4">
        {filteredHomework.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-600">No homework found for the selected filter.</p>
          </div>
        ) : (
          filteredHomework.map((hw: any) => (
            <div
              key={hw.id}
              className={`bg-white border-l-4 ${getPriorityColor(hw.daysUntilDue, hw.submissionStatus)} rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hw.submissionStatus)}`}>
                      {getStatusIcon(hw.submissionStatus)} {hw.submissionStatus}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Image src="/subject.png" alt="Subject" width={16} height={16} />
                        <span>{hw.subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Image src="/teacher.png" alt="Teacher" width={16} height={16} />
                        <span>{hw.teacher.firstName} {hw.teacher.lastName}</span>
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
                        {hw.daysUntilDue >= 0 && hw.submissionStatus === "PENDING" && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            hw.daysUntilDue <= 1 ? "bg-red-100 text-red-700" :
                            hw.daysUntilDue <= 3 ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {hw.daysUntilDue === 0 ? "Due today!" : 
                             hw.daysUntilDue === 1 ? "Due tomorrow" : 
                             `${hw.daysUntilDue} days left`}
                          </span>
                        )}
                        {hw.daysUntilDue < 0 && hw.submissionStatus === "PENDING" && (
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                            {Math.abs(hw.daysUntilDue)} days overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {hw.description && (
                    <p className="text-sm text-gray-600 mb-3">{hw.description}</p>
                  )}

                  {/* Progress Indicator */}
                  {hw.dueDate && hw.submissionStatus === 'PENDING' && (
                    <div className="mb-4">
                      {(() => {
                        const progressInfo = getProgressStatus(hw.dueDate, hw.submissionStatus);
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

                  {hw.instructions && (
                    <div className="bg-blue-50 p-3 rounded-md mb-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions:</h4>
                      <p className="text-sm text-blue-800">{hw.instructions}</p>
                    </div>
                  )}

                  {/* ATTACHMENTS */}
                  {hw.attachments && hw.attachments.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                        📎 Teacher Attachments ({hw.attachments.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hw.attachments.map((attachment: any) => {
                          // Construct proper file URL using the file serving API
                          let fileUrl = attachment.fileUrl || attachment.url || attachment.filePath || '';
                          if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:') && !fileUrl.startsWith('data:') && !fileUrl.startsWith('/api/files/')) {
                            const cleanPath = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
                            fileUrl = `/api/files/${cleanPath}`;
                          }
                          
                          return (
                            <div key={attachment.id} className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg hover:shadow-md transition-shadow">
                              <div className="text-2xl">
                                {attachment.fileType === "IMAGE" ? "🖼️" :
                                 attachment.fileType === "DOCUMENT" ? "📄" :
                                 attachment.fileType === "AUDIO" ? "🎵" :
                                 attachment.fileType === "VIDEO" ? "🎬" :
                                 attachment.fileType === "LINK" ? "🔗" : "📎"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.originalName || attachment.fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {attachment.fileType || 'File'} • {(attachment.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                  title="View file"
                                >
                                  👁️
                                </a>
                                <a
                                  href={fileUrl}
                                  download={attachment.originalName || attachment.fileName}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                  title="Download file"
                                >
                                  📥
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUBMISSION STATUS */}
                  {hw.submission && (
                    <div className="bg-green-50 p-3 rounded-md mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-green-900">Your Submission:</h4>
                        <span className="text-xs text-green-700">
                          Submitted: {new Date(hw.submission.submissionDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {hw.submission.content && (
                        <p className="text-sm text-green-800 mb-2">{hw.submission.content}</p>
                      )}
                      
                      {hw.submission.grade !== null && hw.submission.grade !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-green-900">Grade:</span>
                          <span className={`px-2 py-1 rounded font-medium ${
                            hw.submission.grade >= 90 ? "bg-green-200 text-green-800" :
                            hw.submission.grade >= 70 ? "bg-blue-200 text-blue-800" :
                            hw.submission.grade >= 50 ? "bg-yellow-200 text-yellow-800" :
                            "bg-red-200 text-red-800"
                          }`}>
                            {hw.submission.grade}%
                          </span>
                        </div>
                      )}
                      
                      {hw.submission.feedback && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-green-900">Teacher Feedback:</span>
                          <p className="text-sm text-green-800 mt-1">{hw.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hw.totalPoints && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                      🎯 {hw.totalPoints} points
                    </span>
                  )}
                  {hw.allowLateSubmission && hw.submissionStatus === "PENDING" && hw.daysUntilDue < 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs">
                      ⚠️ Late submission allowed
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onHomeworkSelect(hw.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 hover:shadow-md text-sm font-medium"
                  >
                    {hw.submission ? "✏️ Update Submission" : "📝 Submit Work"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QUICK STATS */}
      {homeworkData.stats && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{homeworkData.stats.completedCount}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{homeworkData.stats.lateCount}</div>
              <div className="text-xs text-gray-600">Late</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{homeworkData.stats.missedCount}</div>
              <div className="text-xs text-gray-600">Missed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{homeworkData.stats.pendingCount}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHomeworkList;
