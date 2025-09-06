"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LessonTopicViewer from "./LessonTopicViewer";

interface StudentMobileTodayViewProps {
  studentId: string;
  filters: any;
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentMobileTodayView = ({ 
  studentId, 
  filters, 
  timeFilter,
  onStudentDataUpdate 
}: StudentMobileTodayViewProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);

  useEffect(() => {
    fetchDayTimetables();
  }, [studentId, selectedDate, timeFilter]);

  const fetchDayTimetables = async () => {
    try {
      setLoading(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
        startDate: startOfDay.toISOString().split('T')[0],
        endDate: endOfDay.toISOString().split('T')[0],
        view: "daily",
        timeFilter,
      });

      const response = await fetch(`/api/student-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
        onStudentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching day timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const isPastClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
    return classDateTime < new Date();
  };

  const isUpcomingClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
    return classDateTime >= now && classDateTime <= in30Minutes;
  };

  const isCurrentClass = (timetable: any) => {
    const now = new Date();
    const startTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
    const endTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
    return now >= startTime && now <= endTime;
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeDistance = swipeStartX - swipeEndX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next day
        navigateDay("next");
      } else {
        // Swipe right - previous day
        navigateDay("prev");
      }
    }
  };

  const getClassStatusBadge = (timetable: any) => {
    if (timeFilter === "past") {
      return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Archived</span>;
    }

    if (isCurrentClass(timetable)) {
      return <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full animate-pulse">In Session</span>;
    }
    
    if (isUpcomingClass(timetable)) {
      return <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-full">Starting Soon</span>;
    }
    
    if (isPastClass(timetable)) {
      return <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">Completed</span>;
    }
    
    return <span className="text-xs text-gray-700 bg-yellow-100 px-2 py-1 rounded-full">Scheduled</span>;
  };

  const getTopicCount = (topics: any[]) => {
    if (!topics || topics.length === 0) return "No topics";
    
    const completed = topics.filter(t => t.status === "COMPLETED").length;
    const inProgress = topics.filter(t => t.status === "IN_PROGRESS").length;
    
    if (completed > 0) return `${completed} topic${completed > 1 ? 's' : ''} completed`;
    if (inProgress > 0) return `${inProgress} topic${inProgress > 1 ? 's' : ''} in progress`;
    return `${topics.length} topic${topics.length > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className="select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* DATE NAVIGATION */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateDay("prev")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <Image src="/arrow.png" alt="Previous" width={20} height={20} className="rotate-180" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString("en-US", { 
              weekday: "long",
              month: "long", 
              day: "numeric" 
            })}
          </h2>
          {isToday() && timeFilter === "current" && (
            <span className="text-sm text-blue-600 font-medium">Today</span>
          )}
          {timeFilter === "past" && (
            <span className="text-sm text-orange-600">Archived</span>
          )}
        </div>
        
        <button
          onClick={() => navigateDay("next")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <Image src="/arrow.png" alt="Next" width={20} height={20} />
        </button>
      </div>

      {/* TODAY BUTTON */}
      {!isToday() && timeFilter === "current" && (
        <div className="text-center mb-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-lamaSky text-white rounded-lg text-sm font-medium"
          >
            Go to Today
          </button>
        </div>
      )}

      {/* SWIPE HINT */}
      <div className="text-center mb-4 text-xs text-gray-500">
        👈 Swipe left/right to navigate days 👉
      </div>

      {/* CLASSES LIST */}
      {timetables.length === 0 ? (
        <div className="text-center py-12">
          <Image
            src="/calendar.png"
            alt="No classes"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Today</h3>
          <p className="text-gray-600">
            {timeFilter === "current" ? "Enjoy your free day!" : "No archived classes for this date."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map((timetable: any) => (
            <div
              key={timetable.id}
              onClick={() => {
                setSelectedTimetable(timetable);
                setShowTopicViewer(true);
              }}
              className={`bg-white rounded-lg border p-4 active:bg-gray-50 transition-colors ${
                isCurrentClass(timetable) ? "ring-2 ring-green-400 bg-green-50" :
                isUpcomingClass(timetable) ? "ring-2 ring-blue-400 bg-blue-50" : ""
              }`}
            >
              {/* CLASS HEADER */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-lamaSky rounded-lg flex items-center justify-center">
                    <Image src="/subject.png" alt="Subject" width={20} height={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{timetable.subject.name}</h3>
                    <p className="text-sm text-gray-600">
                      {timetable.teacher.firstName} {timetable.teacher.lastName}
                    </p>
                  </div>
                </div>
                {getClassStatusBadge(timetable)}
              </div>

              {/* CLASS DETAILS */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Image src="/lesson.png" alt="Time" width={16} height={16} />
                  <span>{formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Image src="/singleClass.png" alt="Room" width={16} height={16} />
                  <span>Room {timetable.roomNumber}</span>
                  {timetable.buildingName && <span>• {timetable.buildingName}</span>}
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Image src="/create.png" alt="Topics" width={16} height={16} />
                  <span>{getTopicCount(timetable.topics)}</span>
                </div>
              </div>

              {/* TOPICS PREVIEW */}
              {timetable.topics && timetable.topics.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Latest Topics:</div>
                  <div className="space-y-1">
                    {timetable.topics.slice(0, 2).map((topic: any, index: number) => (
                      <div key={topic.id} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          topic.status === "COMPLETED" ? "bg-green-500" :
                          topic.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-gray-400"
                        }`}></div>
                        <span className="text-sm text-gray-700 truncate">{topic.title}</span>
                      </div>
                    ))}
                    {timetable.topics.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{timetable.topics.length - 2} more topics
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QUICK ACTIONS */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tap to view details</span>
                  <Image src="/view.png" alt="View" width={16} height={16} className="opacity-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LESSON TOPIC VIEWER MODAL */}
      {showTopicViewer && selectedTimetable && (
        <LessonTopicViewer
          timetable={selectedTimetable}
          isReadOnly={timeFilter === "past"}
          onClose={() => {
            setShowTopicViewer(false);
            setSelectedTimetable(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentMobileTodayView;
