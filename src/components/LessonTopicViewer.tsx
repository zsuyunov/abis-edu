"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  X, 
  Eye, 
  Download,
  Sparkles,
  TrendingUp,
  Award,
  Target
} from "lucide-react";

interface LessonTopicViewerProps {
  timetable: any;
  isReadOnly: boolean;
  onClose: () => void;
}

const LessonTopicViewer = ({ timetable, isReadOnly, onClose }: LessonTopicViewerProps) => {
  const [topics, setTopics] = useState(timetable.topics || []);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-800", label: "In Progress" },
      DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getProgressBar = (percentage: number) => {
    const color = percentage === 100 ? "bg-green-500" : percentage > 50 ? "bg-blue-500" : "bg-yellow-500";
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const renderAttachments = (attachments: string[]) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-blue-500" />
          <h5 className="text-sm font-semibold text-gray-700">Attachments:</h5>
        </div>
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 hover:text-blue-900 cursor-pointer font-medium flex-1">
                {attachment.split('/').pop() || `Attachment ${index + 1}`}
              </span>
              <Download className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isPastLesson = () => {
    const lessonDateTime = new Date(timetable.fullDate + 'T' + formatTime(timetable.endTime));
    return lessonDateTime < new Date();
  };

  const isUpcomingLesson = () => {
    const lessonDateTime = new Date(timetable.fullDate + 'T' + formatTime(timetable.startTime));
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return lessonDateTime >= now && lessonDateTime <= in2Hours;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {timetable.subject.name}
                </h2>
                <p className="text-blue-600 font-medium">Lesson Details & Topics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/80 hover:bg-white rounded-xl text-gray-500 hover:text-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-600">Teacher</p>
                <p className="font-medium text-gray-900">{timetable.teacher.firstName} {timetable.teacher.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
              <MapPin className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-600">Class & Room</p>
                <p className="font-medium text-gray-900">{timetable.class.name} - Room {timetable.roomNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-600">Date</p>
                <p className="font-medium text-gray-900">{formatDate(timetable.fullDate).split(',')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-600">Time</p>
                <p className="font-medium text-gray-900">{formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {isUpcomingLesson() && !isReadOnly && (
              <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" />
                Upcoming!
              </span>
            )}
            {isPastLesson() && (
              <span className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                <CheckCircle className="w-3 h-3" />
                Past Lesson
              </span>
            )}
          </div>

          {isReadOnly && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
              <div className="flex items-center gap-3 text-orange-800">
                <Eye className="w-5 h-5" />
                <span className="font-medium">Read-only archived timetable</span>
              </div>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Topics Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {isReadOnly 
                  ? "No topics were added for this lesson."
                  : "Your teacher hasn't added any topics for this lesson yet. Check back later!"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOPICS LIST */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Lesson Topics ({topics.length})
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {topics.map((topic: any, index: number) => (
                    <div key={topic.id} className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      {/* TOPIC HEADER */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {index + 1}. {topic.title}
                            </h4>
                            {getStatusBadge(topic.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Added by {topic.teacher.firstName} {topic.teacher.lastName}</span>
                            <span>•</span>
                            <span>{formatDate(topic.createdAt)}</span>
                            {topic.completedAt && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">
                                  Completed {formatDate(topic.completedAt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* TOPIC DESCRIPTION */}
                      {topic.description && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Description:</h5>
                          <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                            {topic.description}
                          </div>
                        </div>
                      )}

                      {/* PROGRESS BAR */}
                      {topic.progressPercentage > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-700">Progress:</h5>
                            <span className="text-sm text-gray-600">{topic.progressPercentage}%</span>
                          </div>
                          {getProgressBar(topic.progressPercentage)}
                        </div>
                      )}

                      {/* ATTACHMENTS */}
                      {renderAttachments(topic.attachments)}
                    </div>
                  ))}
                </div>
              </div>

              {/* LESSON SUMMARY */}
              {topics.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Lesson Summary</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center bg-white/60 rounded-xl p-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">{topics.length}</div>
                      <div className="text-gray-600 font-medium">Total Topics</div>
                    </div>
                    <div className="text-center bg-white/60 rounded-xl p-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                        {topics.filter((t: any) => t.status === "COMPLETED").length}
                      </div>
                      <div className="text-gray-600 font-medium">Completed</div>
                    </div>
                    <div className="text-center bg-white/60 rounded-xl p-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                        {topics.filter((t: any) => t.status === "IN_PROGRESS").length}
                      </div>
                      <div className="text-gray-600 font-medium">In Progress</div>
                    </div>
                    <div className="text-center bg-white/60 rounded-xl p-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                        {Math.round(topics.reduce((sum: number, t: any) => sum + t.progressPercentage, 0) / topics.length) || 0}%
                      </div>
                      <div className="text-gray-600 font-medium">Avg Progress</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-200 p-6 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 font-medium">
              {!isReadOnly && "📚 This lesson content is prepared by your teacher for your learning."}
              {isReadOnly && "📋 This is archived lesson content for reference."}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonTopicViewer;
