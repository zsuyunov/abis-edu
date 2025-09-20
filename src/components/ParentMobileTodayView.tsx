/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LessonTopicViewer from "./LessonTopicViewer";

interface ParentMobileTodayViewProps {
  parentId: string;
  childId: string;
  filters: any;
  timeFilter: "current" | "past";
  onParentDataUpdate: (data: any) => void;
}

const ParentMobileTodayView = ({ 
  parentId,
  childId, 
  filters, 
  timeFilter,
  onParentDataUpdate 
}: ParentMobileTodayViewProps) => {
  const [timetables, setTimetables] = useState([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);

  useEffect(() => {
    fetchTodayTimetables();
  }, [parentId, childId, selectedDate, timeFilter]);

  const fetchTodayTimetables = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        childId,
        ...filters,
        startDate: selectedDate.toISOString().split('T')[0],
        endDate: selectedDate.toISOString().split('T')[0],
        view: "today",
        timeFilter,
      });

      const response = await fetch(`/api/parent-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
        setSelectedChild(data.selectedChild);
        onParentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching today's timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
    return classDateTime < new Date();
  };

  const isUpcomingClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return classDateTime >= now && classDateTime <= in2Hours;
  };

  const isCurrentClass = (timetable: any) => {
    const now = new Date();
    const startTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
    const endTime = new Date(timetable.fullDate + 'T' + new Date(timetable.endTime).toTimeString().split(' ')[0]);
    return now >= startTime && now <= endTime;
  };

  const getNextClass = () => {
    if (timeFilter === "past") return null;
    
    const now = new Date();
    return timetables.find((timetable: any) => {
      const startTime = new Date(timetable.fullDate + 'T' + new Date(timetable.startTime).toTimeString().split(' ')[0]);
      return startTime > now;
    });
  };

  const getCurrentClass = () => {
    if (timeFilter === "past") return null;
    
    return timetables.find((timetable: any) => isCurrentClass(timetable));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getClassCard = (timetable: any, index: number) => {
    let statusColor = "bg-white border-gray-200";
    let statusText = "";
    let statusIcon = null;

    if (timeFilter === "current") {
      if (isCurrentClass(timetable)) {
        statusColor = "bg-green-50 border-green-300 ring-2 ring-green-200";
        statusText = "In Progress";
        statusIcon = <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>;
      } else if (isUpcomingClass(timetable)) {
        statusColor = "bg-blue-50 border-blue-300 ring-2 ring-blue-200";
        statusText = "Coming Up";
        statusIcon = <span className="w-2 h-2 bg-blue-500 rounded-full"></span>;
      } else if (isPastClass(timetable)) {
        statusColor = "bg-gray-50 border-gray-200 opacity-75";
        statusText = "Completed";
        statusIcon = <span className="w-2 h-2 bg-gray-400 rounded-full"></span>;
      }
    } else {
      statusColor = "bg-gray-50 border-gray-200";
      statusText = "Archived";
      statusIcon = <span className="w-2 h-2 bg-gray-400 rounded-full"></span>;
    }

    return (
      <div
        key={timetable.id}
        onClick={() => {
          setSelectedTimetable(timetable);
          setShowTopicViewer(true);
        }}
        className={`${statusColor} border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {timetable.subjects && timetable.subjects.length > 0 
                ? timetable.subjects.map(s => s.name).join(' | ')
                : timetable.subject?.name || 'No Subject'}
            </h3>
            <div className="text-sm text-gray-600 mb-2">
              {timetable.teacher.firstName} {timetable.teacher.lastName}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Image src="/lesson.png" alt="Time" width={14} height={14} />
                {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
              </div>
              <div className="flex items-center gap-1">
                <Image src="/singleClass.png" alt="Room" width={14} height={14} />
                Room {timetable.roomNumber}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-xs px-2 py-1 rounded-full mb-2 ${
              timetable.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}>
              {timetable.status}
            </div>
            {statusText && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                {statusIcon}
                {statusText}
              </div>
            )}
          </div>
        </div>

        {/* Topics Summary }
        <div className="border-t border-gray-100 pt-3">
          {timetable.topics && timetable.topics.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {timetable.topics.length} topic{timetable.topics.length > 1 ? 's' : ''} available
              </div>
              <div className="flex items-center gap-2">
                {timetable.topics.filter((t: any) => t.status === "COMPLETED").length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {timetable.topics.filter((t: any) => t.status === "COMPLETED").length} completed
                  </span>
                )}
                {timetable.topics.filter((t: any) => t.status === "IN_PROGRESS").length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {timetable.topics.filter((t: any) => t.status === "IN_PROGRESS").length} in progress
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No lesson topics available yet
            </div>
          )}
        </div>

        {/* Quick Actions }
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Tap to view lesson details
          </div>
          <Image src="/view.png" alt="View" width={16} height={16} className="opacity-50" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const currentClass = getCurrentClass();
  const nextClass = getNextClass();

  return (
    <div className="space-y-6">
      {/* DATE NAVIGATION }
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Image src="/sort.png" alt="Previous" width={16} height={16} className="rotate-90" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDateFull(selectedDate)}
            </h2>
            {isToday(selectedDate) && timeFilter === "current" && (
              <span className="text-sm text-blue-600 font-medium">Today</span>
            )}
            {timeFilter === "past" && (
              <span className="text-sm text-orange-600">Archived Schedule</span>
            )}
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Image src="/sort.png" alt="Next" width={16} height={16} className="-rotate-90" />
          </button>
        </div>

        {!isToday(selectedDate) && timeFilter === "current" && (
          <button
            onClick={goToToday}
            className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            Go to Today
          </button>
        )}
      </div>

      {/* CHILD INFO }
      {selectedChild && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {selectedChild.firstName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                {selectedChild.firstName} {selectedChild.lastName}
              </h3>
              <p className="text-sm text-blue-700">
                {selectedChild.studentId} • {selectedChild.class.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CURRENT/NEXT CLASS STATUS }
      {timeFilter === "current" && isToday(selectedDate) && (
        <div className="space-y-3">
          {currentClass && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-green-900">Currently in class</span>
              </div>
              <div className="text-green-800">
                <div className="font-semibold">{currentClass.subject.name}</div>
                <div className="text-sm">
                  with {currentClass.teacher.firstName} {currentClass.teacher.lastName} in Room {currentClass.roomNumber}
                </div>
                <div className="text-sm">
                  Until {formatTime(currentClass.endTime)}
                </div>
              </div>
            </div>
          )}

          {nextClass && !currentClass && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-sm font-medium text-blue-900">Next class</span>
              </div>
              <div className="text-blue-800">
                <div className="font-semibold">{nextClass.subject.name}</div>
                <div className="text-sm">
                  with {nextClass.teacher.firstName} {nextClass.teacher.lastName} in Room {nextClass.roomNumber}
                </div>
                <div className="text-sm">
                  Starts at {formatTime(nextClass.startTime)}
                </div>
              </div>
            </div>
          )}

          {!currentClass && !nextClass && timetables.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <Image 
                src="/calendar.png" 
                alt="No classes" 
                width={48} 
                height={48} 
                className="mx-auto mb-3 opacity-50"
              />
              <div className="text-yellow-800 font-medium">No classes today</div>
              <div className="text-sm text-yellow-700 mt-1">
                {selectedChild?.firstName} has a free day!
              </div>
            </div>
          )}
        </div>
      )}

      {/* TODAY'S SCHEDULE }
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {timeFilter === "current" && isToday(selectedDate) ? "Today's" : "Daily"} Schedule
            </h3>
            <span className="text-sm text-gray-600">
              {timetables.length} class{timetables.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        {timetables.length === 0 ? (
          <div className="p-8 text-center">
            <Image 
              src="/calendar.png" 
              alt="No classes" 
              width={64} 
              height={64} 
              className="mx-auto mb-4 opacity-50"
            />
            <h4 className="font-medium text-gray-900 mb-2">No Classes Scheduled</h4>
            <p className="text-gray-600 text-sm">
              {timeFilter === "current" 
                ? `${selectedChild?.firstName} has no classes on this day.`
                : "No archived classes found for this date."
              }
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {timetables
              .sort((a: any, b: any) => 
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              )
              .map((timetable, index) => getClassCard(timetable, index))
            }
          </div>
        )}
      </div>

      {/* DAY SUMMARY }
      {timetables.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Image src="/result.png" alt="Summary" width={16} height={16} />
            Day Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-blue-800">
              <div className="font-medium">{timetables.length} Classes</div>
              <div className="text-xs opacity-75">Total scheduled</div>
            </div>
            <div className="text-blue-800">
              <div className="font-medium">
                {timetables.reduce((sum: number, t: any) => sum + t.topics.length, 0)} Topics
              </div>
              <div className="text-xs opacity-75">Learning materials</div>
            </div>
            <div className="text-blue-800">
              <div className="font-medium">
                {new Set(timetables.map((t: any) => t.teacher.id)).size} Teachers
              </div>
              <div className="text-xs opacity-75">Different instructors</div>
            </div>
            <div className="text-blue-800">
              <div className="font-medium">
                {timetables.reduce((sum: number, t: any) => 
                  sum + t.topics.filter((topic: any) => topic.status === "COMPLETED").length, 0
                )} Completed
              </div>
              <div className="text-xs opacity-75">Finished topics</div>
            </div>
          </div>
        </div>
      )}

      {/* PARENT TIP }
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2 flex items-center gap-2">
          <Image src="/parent.png" alt="Tip" width={16} height={16} />
          Parent Tip
        </h4>
        <p className="text-xs text-yellow-800">
          {timeFilter === "current" ? (
            isToday(selectedDate) ? (
              "Use this view to stay updated on your child's daily schedule. Tap any class to see what they're learning today!"
            ) : (
              "Navigate through dates to help your child prepare for upcoming classes or review past lessons."
            )
          ) : (
            "Review past schedules to track your child's learning progress and discuss completed topics with them."
          )}
        </p>
      </div>

      {/* LESSON TOPIC VIEWER MODAL }
      {showTopicViewer && selectedTimetable && (
        <LessonTopicViewer
          timetable={selectedTimetable}
          isReadOnly={true} // Parents always have read-only access
          onClose={() => {
            setShowTopicViewer(false);
            setSelectedTimetable(null);
          }}
        />
      )}
    </div>
  );
};

export default ParentMobileTodayView;



*/