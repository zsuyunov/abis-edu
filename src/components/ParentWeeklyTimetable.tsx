/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LessonTopicViewer from "./LessonTopicViewer";

interface ParentWeeklyTimetableProps {
  parentId: string;
  childId: string;
  filters: any;
  dateRange: { start: Date; end: Date };
  timeFilter: "current" | "past";
  onParentDataUpdate: (data: any) => void;
}

const ParentWeeklyTimetable = ({ 
  parentId,
  childId, 
  filters, 
  dateRange, 
  timeFilter,
  onParentDataUpdate 
}: ParentWeeklyTimetableProps) => {
  const [timetables, setTimetables] = useState([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  useEffect(() => {
    fetchTimetables();
  }, [parentId, childId, filters, dateRange, timeFilter]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        childId,
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        view: "weekly",
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
      console.error("Error fetching timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getDayFromDate = (date: string) => {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayIndex = new Date(date).getDay();
    return dayNames[dayIndex];
  };

  const getTimetableForSlot = (day: string, timeSlot: string) => {
    return timetables.find((timetable: any) => {
      const timetableDay = getDayFromDate(timetable.fullDate);
      const timetableTime = formatTime(timetable.startTime);
      return timetableDay === day.toLowerCase() && timetableTime === timeSlot;
    });
  };

  const isToday = (day: string) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return day === today;
  };

  const isPastClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + formatTime(timetable.endTime));
    return classDateTime < new Date();
  };

  const isUpcomingClass = (timetable: any) => {
    const classDateTime = new Date(timetable.fullDate + 'T' + formatTime(timetable.startTime));
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return classDateTime >= now && classDateTime <= in2Hours;
  };

  const isCurrentClass = (timetable: any) => {
    const now = new Date();
    const startTime = new Date(timetable.fullDate + 'T' + formatTime(timetable.startTime));
    const endTime = new Date(timetable.fullDate + 'T' + formatTime(timetable.endTime));
    return now >= startTime && now <= endTime;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTopicStatusIndicator = (topics: any[]) => {
    if (!topics || topics.length === 0) {
      return <span className="text-xs text-gray-400">No topics</span>;
    }

    const completedCount = topics.filter(t => t.status === "COMPLETED").length;
    const inProgressCount = topics.filter(t => t.status === "IN_PROGRESS").length;

    if (completedCount > 0) {
      return (
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          {completedCount} completed
        </span>
      );
    } else if (inProgressCount > 0) {
      return (
        <span className="text-xs text-blue-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          {inProgressCount} in progress
        </span>
      );
    }

    return (
      <span className="text-xs text-gray-600 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        {topics.length} topic{topics.length > 1 ? 's' : ''}
      </span>
    );
  };

  const handleSlotClick = (timetable: any) => {
    if (timetable) {
      setSelectedTimetable(timetable);
      setShowTopicViewer(true);
    }
  };

  const getSlotClassNames = (timetable: any) => {
    let baseClasses = "p-3 rounded-md border min-h-[90px] cursor-pointer transition-all duration-200";
    
    if (!timetable) {
      return `${baseClasses} bg-gray-50 border-gray-100 cursor-default`;
    }

    let statusClasses = "bg-white border-gray-200 hover:shadow-md";
    
    if (timeFilter === "current") {
      if (isCurrentClass(timetable)) {
        statusClasses = "bg-green-50 border-green-300 ring-2 ring-green-200 hover:shadow-lg";
      } else if (isUpcomingClass(timetable)) {
        statusClasses = "bg-blue-50 border-blue-300 ring-2 ring-blue-200 hover:shadow-lg";
      } else if (isPastClass(timetable)) {
        statusClasses = "bg-gray-50 border-gray-200 opacity-75 hover:shadow-sm";
      }
    } else {
      statusClasses = "bg-gray-50 border-gray-200 opacity-80 hover:shadow-sm";
    }

    return `${baseClasses} ${statusClasses}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER WITH CHILD INFO }
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">
            {selectedChild?.firstName} {selectedChild?.lastName}'s Weekly Schedule
          </h2>
          <p className="text-sm text-gray-600">
            {selectedChild?.class.name} • Week of {dateRange.start.toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric" 
            })} - {dateRange.end.toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric",
              year: "numeric"
            })}
          </p>
          {selectedChild?.class.supervisor && (
            <p className="text-xs text-gray-500 mt-1">
              Class Supervisor: {selectedChild.class.supervisor.firstName} {selectedChild.class.supervisor.lastName}
            </p>
          )}
        </div>
        
        {timeFilter === "past" && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Image src="/calendar.png" alt="Archive" width={16} height={16} />
            <span>Archived Timetable</span>
          </div>
        )}
      </div>

      {/* QUICK STATS }
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">{timetables.length}</div>
          <div className="text-xs text-blue-700">Total Classes</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {timetables.filter(t => t.topics.length > 0).length}
          </div>
          <div className="text-xs text-green-700">With Topics</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-600">
            {timetables.reduce((sum, t) => sum + t.topics.length, 0)}
          </div>
          <div className="text-xs text-purple-700">Total Topics</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-600">
            {timetables.reduce((sum, t) => sum + t.topics.filter(topic => topic.status === "COMPLETED").length, 0)}
          </div>
          <div className="text-xs text-orange-700">Completed</div>
        </div>
      </div>

      {/* TIMETABLE GRID }
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* HEADER }
          <div className="grid grid-cols-6 gap-2 mb-4">
            <div className="p-3 bg-gray-100 rounded-md font-medium text-center">
              Time
            </div>
            {days.map((day) => (
              <div
                key={day}
                className={`p-3 rounded-md font-medium text-center ${
                  isToday(day) && timeFilter === "current"
                    ? "bg-lamaSky text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {day}
                {isToday(day) && timeFilter === "current" && (
                  <div className="text-xs mt-1 opacity-90">Today</div>
                )}
              </div>
            ))}
          </div>

          {/* TIME SLOTS }
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="grid grid-cols-6 gap-2 mb-2">
              {/* TIME COLUMN }
              <div className="p-3 bg-gray-50 rounded-md text-sm font-medium text-center text-gray-600">
                {timeSlot}
              </div>

              {/* DAY COLUMNS }
              {days.map((day) => {
                const timetable = getTimetableForSlot(day, timeSlot);
                
                return (
                  <div
                    key={`${day}-${timeSlot}`}
                    className={getSlotClassNames(timetable)}
                    onClick={() => handleSlotClick(timetable)}
                  >
                    {timetable ? (
                      <div className="h-full flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {timetable.subject.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {timetable.teacher.firstName} {timetable.teacher.lastName}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            Room {timetable.roomNumber}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(timetable.status)}`}>
                            {timetable.status}
                          </div>
                        </div>

                        <div className="mt-2">
                          {getTopicStatusIndicator(timetable.topics)}
                          {timeFilter === "current" && isCurrentClass(timetable) && (
                            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              In session
                            </div>
                          )}
                          {timeFilter === "current" && isUpcomingClass(timetable) && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              Upcoming
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        Free Period
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* PARENT GUIDANCE }
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Image src="/parent.png" alt="Parent" width={16} height={16} />
          Parent Guidance
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div>• Click on any class to view lesson topics and help your child prepare</div>
          <div>• Green indicators show completed topics - great for review sessions</div>
          <div>• Blue indicators show ongoing topics - encourage your child to stay engaged</div>
          <div>• Use this schedule to plan study time and homework sessions at home</div>
          {timeFilter === "current" && (
            <div>• Classes marked "In session" or "Upcoming" are happening today</div>
          )}
        </div>
      </div>

      {/* LEGEND }
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>In Progress Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Draft Topics</span>
          </div>
          {timeFilter === "current" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-300 border-2 border-green-500 rounded-full"></div>
                <span>Class in Session</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-300 border-2 border-blue-500 rounded-full"></div>
                <span>Upcoming Class</span>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          💡 Click on any class slot to view detailed lesson topics and teacher notes
        </div>
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

export default ParentWeeklyTimetable;

*/