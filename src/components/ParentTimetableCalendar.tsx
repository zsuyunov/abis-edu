"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LessonTopicViewer from "./LessonTopicViewer";

interface ParentTimetableCalendarProps {
  parentId: string;
  childId: string;
  filters: any;
  view: string;
  dateRange: { start: Date; end: Date };
  timeFilter: "current" | "past";
  onParentDataUpdate: (data: any) => void;
}

const ParentTimetableCalendar = ({ 
  parentId,
  childId, 
  filters, 
  view,
  dateRange,
  timeFilter,
  onParentDataUpdate 
}: ParentTimetableCalendarProps) => {
  const [timetables, setTimetables] = useState([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchCalendarData();
  }, [parentId, childId, filters, view, dateRange, timeFilter, currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        childId,
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        view: "calendar",
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
      console.error("Error fetching calendar data:", error);
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTimetablesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return timetables.filter((timetable: any) => {
      const timetableDate = timetable.fullDate.split('T')[0];
      return timetableDate === dateString;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getMonthYear = () => {
    return currentMonth.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long" 
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {selectedChild?.firstName}'s Calendar View
        </h2>
        <p className="text-gray-600">
          Monthly overview of classes and lesson topics
        </p>
        {timeFilter === "past" && (
          <span className="inline-block mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            📚 Archived Calendar
          </span>
        )}
      </div>

      {/* MONTH NAVIGATION */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Image src="/sort.png" alt="Previous" width={20} height={20} className="rotate-90" />
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900">
            {getMonthYear()}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Image src="/sort.png" alt="Next" width={20} height={20} className="-rotate-90" />
          </button>
        </div>

        {/* CALENDAR GRID */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((dayName) => (
            <div key={dayName} className="p-2 text-center font-medium text-gray-600 text-sm">
              {dayName}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-24"></div>;
            }
            
            const dayTimetables = getTimetablesForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`h-24 border border-gray-200 rounded-md p-1 overflow-hidden ${
                  isCurrentDay && timeFilter === "current"
                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                    : "bg-white hover:bg-gray-50"
                } transition-colors`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay && timeFilter === "current" ? "text-blue-600" : "text-gray-900"
                }`}>
                  {day.getDate()}
                  {isCurrentDay && timeFilter === "current" && (
                    <span className="ml-1 text-xs text-blue-500">•</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayTimetables.slice(0, 2).map((timetable: any) => (
                    <button
                      key={timetable.id}
                      onClick={() => {
                        setSelectedTimetable(timetable);
                        setShowTopicViewer(true);
                      }}
                      className="w-full text-left p-1 rounded text-xs bg-lamaSky text-white hover:bg-blue-600 transition-colors truncate"
                      title={`${timetable.subject.name} - ${formatTime(timetable.startTime)}`}
                    >
                      {timetable.subject.name}
                    </button>
                  ))}
                  
                  {dayTimetables.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayTimetables.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MONTHLY SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{timetables.length}</div>
          <div className="text-sm text-blue-700">Total Classes This Month</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {timetables.filter((t: any) => t.topics.length > 0).length}
          </div>
          <div className="text-sm text-green-700">Classes with Topics</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(timetables.map((t: any) => t.subject.id)).size}
          </div>
          <div className="text-sm text-purple-700">Different Subjects</div>
        </div>
      </div>

      {/* UPCOMING CLASSES (FOR CURRENT FILTER) */}
      {timeFilter === "current" && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Classes</h3>
          </div>
          
          {timetables.filter((t: any) => {
            const classDateTime = new Date(t.fullDate + 'T' + new Date(t.startTime).toTimeString().split(' ')[0]);
            return classDateTime > new Date();
          }).slice(0, 5).length > 0 ? (
            <div className="p-4 space-y-3">
              {timetables
                .filter((t: any) => {
                  const classDateTime = new Date(t.fullDate + 'T' + new Date(t.startTime).toTimeString().split(' ')[0]);
                  return classDateTime > new Date();
                })
                .slice(0, 5)
                .map((timetable: any) => (
                  <div
                    key={timetable.id}
                    onClick={() => {
                      setSelectedTimetable(timetable);
                      setShowTopicViewer(true);
                    }}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{timetable.subject.name}</div>
                      <div className="text-sm text-gray-600">
                        {timetable.teacher.firstName} {timetable.teacher.lastName} • Room {timetable.roomNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(timetable.fullDate).toLocaleDateString("en-US", { 
                          month: "short", 
                          day: "numeric" 
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTime(timetable.startTime)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Image 
                src="/calendar.png" 
                alt="No upcoming classes" 
                width={48} 
                height={48} 
                className="mx-auto mb-3 opacity-50"
              />
              <p className="text-gray-600">No upcoming classes this month</p>
            </div>
          )}
        </div>
      )}

      {/* LEGEND */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Calendar Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-lamaSky rounded"></div>
            <span>Scheduled Classes</span>
          </div>
          {timeFilter === "current" && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded"></div>
              <span>Today</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>No Classes</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          💡 Click on any class to view detailed lesson topics and teacher notes
        </div>
      </div>

      {/* LESSON TOPIC VIEWER MODAL */}
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

export default ParentTimetableCalendar;
