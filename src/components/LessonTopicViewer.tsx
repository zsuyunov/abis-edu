"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
      <div className="mt-3">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h5>
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <Image src="/upload.png" alt="Attachment" width={16} height={16} />
              <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                {attachment.split('/').pop() || `Attachment ${index + 1}`}
              </span>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {timetable.subject.name} - Lesson Details
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Image src="/teacher.png" alt="Teacher" width={16} height={16} />
                  {timetable.teacher.firstName} {timetable.teacher.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <Image src="/class.png" alt="Class" width={16} height={16} />
                  {timetable.class.name}
                </span>
                <span className="flex items-center gap-1">
                  <Image src="/singleClass.png" alt="Room" width={16} height={16} />
                  Room {timetable.roomNumber}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Image src="/calendar.png" alt="Date" width={16} height={16} />
                  {formatDate(timetable.fullDate)}
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Image src="/lesson.png" alt="Time" width={16} height={16} />
                  {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                </span>
                {isUpcomingLesson() && !isReadOnly && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Upcoming!
                  </span>
                )}
                {isPastLesson() && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    Past Lesson
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <Image src="/close.png" alt="Close" width={24} height={24} />
            </button>
          </div>

          {isReadOnly && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2 text-orange-800">
                <Image src="/view.png" alt="Read Only" width={16} height={16} />
                <span className="text-sm font-medium">Read-only archived timetable</span>
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
            <div className="text-center py-12">
              <Image
                src="/nodata.png"
                alt="No topics"
                width={64}
                height={64}
                className="mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Topics Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {isReadOnly 
                  ? "No topics were added for this lesson."
                  : "Your teacher hasn't added any topics for this lesson yet. Check back later!"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOPICS LIST */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Lesson Topics ({topics.length})
                </h3>
                
                <div className="space-y-4">
                  {topics.map((topic: any, index: number) => (
                    <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Lesson Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{topics.length}</div>
                      <div className="text-gray-600">Total Topics</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {topics.filter(t => t.status === "COMPLETED").length}
                      </div>
                      <div className="text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {topics.filter(t => t.status === "IN_PROGRESS").length}
                      </div>
                      <div className="text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {Math.round(topics.reduce((sum, t) => sum + t.progressPercentage, 0) / topics.length) || 0}%
                      </div>
                      <div className="text-gray-600">Avg Progress</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {!isReadOnly && "This lesson content is prepared by your teacher for your learning."}
              {isReadOnly && "This is archived lesson content for reference."}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-lamaSky text-white rounded-md hover:bg-blue-600"
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
