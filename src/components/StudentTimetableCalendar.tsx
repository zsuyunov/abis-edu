"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Download, Search, Filter } from "lucide-react";
import LessonTopicViewer from "./LessonTopicViewer";

interface StudentTimetableCalendarProps {
  studentId: string;
  filters: any;
  view: "monthly" | "termly" | "yearly" | "calendar";
  dateRange: { start: Date; end: Date };
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentTimetableCalendar = ({ 
  studentId, 
  filters, 
  view, 
  dateRange, 
  timeFilter,
  onStudentDataUpdate 
}: StudentTimetableCalendarProps) => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);

  useEffect(() => {
    fetchTimetables();
  }, [studentId, filters, dateRange, timeFilter]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        view,
        timeFilter,
      });

      const response = await fetch(`/api/student-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
        onStudentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTimetablesForDate = (date: Date) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return timetables.filter((timetable: any) => 
      timetable.fullDate.split('T')[0] === dateString
    );
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isInCurrentMonth = (date: Date) => {
    if (!date) return false;
    return date.getMonth() === selectedDate.getMonth();
  };

  const isPastDate = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimetableClick = (timetable: any) => {
    setSelectedTimetable(timetable);
    setShowTopicViewer(true);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getTopicStatusColor = (topics: any[]) => {
    if (!topics || topics.length === 0) return "bg-gray-200";
    
    const hasCompleted = topics.some(t => t.status === "COMPLETED");
    const hasInProgress = topics.some(t => t.status === "IN_PROGRESS");
    
    if (hasCompleted) return "bg-green-300";
    if (hasInProgress) return "bg-blue-300";
    return "bg-yellow-300";
  };

  const getSubjectColor = (subjectName: string) => {
    // Simple color mapping based on subject name
    const colors = [
      "bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400",
      "bg-purple-400", "bg-pink-400", "bg-indigo-400", "bg-teal-400"
    ];
    const index = subjectName.length % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(selectedDate);
  const selectedDateTimetables = getTimetablesForDate(selectedDate);

  return (
    <div>
      {/* CALENDAR HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedDate.toLocaleDateString("en-US", { 
              month: "long", 
              year: "numeric" 
            })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <Image src="/arrow.png" alt="Previous" width={16} height={16} className="rotate-180" />
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <Image src="/arrow.png" alt="Next" width={16} height={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {timeFilter === "past" && (
            <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              📚 Archived
            </span>
          )}
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 text-sm bg-lamaSky text-white rounded-md hover:bg-blue-600"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CALENDAR GRID */}
        <div className="lg:col-span-2">
          {/* WEEKDAY HEADERS */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* CALENDAR DAYS */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const dayTimetables = date ? getTimetablesForDate(date) : [];
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    date && isToday(date) && timeFilter === "current" ? "bg-blue-50 border-blue-300" : ""
                  } ${
                    date && !isInCurrentMonth(date) ? "bg-gray-50 text-gray-400" : ""
                  } ${
                    date && date.toDateString() === selectedDate.toDateString() 
                      ? "ring-2 ring-lamaSky" : ""
                  } ${
                    date && isPastDate(date) && timeFilter === "current" ? "opacity-75" : ""
                  }`}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <div className="text-sm font-medium mb-1 flex items-center justify-between">
                        <span>{date.getDate()}</span>
                        {isToday(date) && timeFilter === "current" && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTimetables.slice(0, 2).map((timetable: any) => (
                          <div
                            key={timetable.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTimetableClick(timetable);
                            }}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 text-white ${
                              getSubjectColor(timetable.subject.name)
                            }`}
                          >
                            <div className="font-medium truncate">
                              {timetable.subject.name}
                            </div>
                            <div className="truncate">
                              {formatTime(timetable.startTime)}
                            </div>
                            {timetable.topics.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <div className={`w-2 h-2 rounded-full ${getTopicStatusColor(timetable.topics)}`}></div>
                                <span>{timetable.topics.length}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {dayTimetables.length > 2 && (
                          <div className="text-xs text-gray-500 bg-gray-100 rounded px-1">
                            +{dayTimetables.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SELECTED DATE DETAILS */}
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="font-medium text-gray-900 mb-4">
            {selectedDate.toLocaleDateString("en-US", { 
              weekday: "long",
              month: "long", 
              day: "numeric",
              year: "numeric"
            })}
          </h3>

          {selectedDateTimetables.length === 0 ? (
            <div className="text-center py-8">
              <Image
                src="/calendar.png"
                alt="No classes"
                width={48}
                height={48}
                className="mx-auto mb-3 opacity-50"
              />
              <p className="text-sm text-gray-600">No classes scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateTimetables.map((timetable: any) => (
                <div
                  key={timetable.id}
                  onClick={() => handleTimetableClick(timetable)}
                  className="p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {timetable.subject.name}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getSubjectColor(timetable.subject.name)}`}></div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Image src="/lesson.png" alt="Time" width={12} height={12} />
                      {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/teacher.png" alt="Teacher" width={12} height={12} />
                      {timetable.teacher.firstName} {timetable.teacher.lastName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Image src="/singleClass.png" alt="Room" width={12} height={12} />
                      Room {timetable.roomNumber}
                    </div>
                    
                    {timetable.topics && timetable.topics.length > 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Image src="/create.png" alt="Topics" width={12} height={12} />
                        {timetable.topics.length} topic{timetable.topics.length > 1 ? 's' : ''}
                        ({timetable.topics.filter((t: any) => t.status === "COMPLETED").length} completed)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Image src="/create.png" alt="Topics" width={12} height={12} />
                        No topics added
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DAILY SUMMARY */}
          {selectedDateTimetables.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Day Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-bold text-blue-600">{selectedDateTimetables.length}</div>
                  <div className="text-gray-600">Classes</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="font-bold text-green-600">
                    {selectedDateTimetables.reduce((sum, t) => sum + t.topics.length, 0)}
                  </div>
                  <div className="text-gray-600">Topics</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LEGEND */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-300 rounded"></div>
            <span>Has Completed Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>Has In-Progress Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-300 rounded"></div>
            <span>Has Draft Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>No Topics</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          💡 Click on any class to view lesson topics and details
        </div>
      </div>

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

export default StudentTimetableCalendar;
