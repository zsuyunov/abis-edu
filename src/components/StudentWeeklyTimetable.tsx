"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, BookOpen, CheckCircle, AlertCircle, FileText, Download, Search, Filter, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import LessonTopicViewer from "./LessonTopicViewer";

interface StudentWeeklyTimetableProps {
  studentId: string;
  filters: any;
  dateRange: { start: Date; end: Date };
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentWeeklyTimetable = ({ 
  studentId, 
  filters, 
  dateRange, 
  timeFilter,
  onStudentDataUpdate 
}: StudentWeeklyTimetableProps) => {
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const daysOfWeek = [
    { key: "MONDAY", label: "Mon", fullLabel: "Monday" },
    { key: "TUESDAY", label: "Tue", fullLabel: "Tuesday" },
    { key: "WEDNESDAY", label: "Wed", fullLabel: "Wednesday" },
    { key: "THURSDAY", label: "Thu", fullLabel: "Thursday" },
    { key: "FRIDAY", label: "Fri", fullLabel: "Friday" },
    { key: "SATURDAY", label: "Sat", fullLabel: "Saturday" },
  ];

  useEffect(() => {
    fetchTimetableData();
  }, [studentId, filters, dateRange, timeFilter]);

  const fetchTimetableData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentId,
        view: "weekly",
        timeFilter,
        ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
      });

      const response = await fetch(`/api/student-timetables?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimetableData(data);
        onStudentDataUpdate(data);
      } else {
        console.error("Failed to fetch timetable data");
      }
    } catch (error) {
      console.error("Error fetching timetable data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableForDayAndTime = (day: string, timeSlot: string) => {
    if (!timetableData?.timetables) return null;

    return timetableData.timetables.find((timetable: any) => {
      const timetableStartTime = new Date(timetable.startTime);
      const slotTime = new Date(`1970-01-01T${timeSlot}:00`);
      
      return timetable.day === day && 
             timetableStartTime.getHours() === slotTime.getHours() && 
             timetableStartTime.getMinutes() === slotTime.getMinutes();
    });
  };

  const isCurrentLesson = (timetable: any) => {
    if (!timetable || timeFilter === "past") return false;
    
    const now = new Date();
    const lessonDate = new Date(timetable.fullDate);
    const startTime = new Date(timetable.startTime);
    const endTime = new Date(timetable.endTime);
    
    const isToday = lessonDate.toDateString() === now.toDateString();
    const isCurrentTime = now >= startTime && now <= endTime;
    
    return isToday && isCurrentTime;
  };

  const isUpcomingLesson = (timetable: any) => {
    if (!timetable || timeFilter === "past") return false;
    
    const now = new Date();
    const startTime = new Date(timetable.startTime);
    const lessonDate = new Date(timetable.fullDate);
    
    const isToday = lessonDate.toDateString() === now.toDateString();
    const isUpcoming = startTime > now && (startTime.getTime() - now.getTime()) <= 2 * 60 * 60 * 1000; // Next 2 hours
    
    return isToday && isUpcoming;
  };

  const handleLessonClick = (timetable: any) => {
    setSelectedTimetable(timetable);
    setShowTopicViewer(true);
  };

  const filteredTimetables = timetableData?.timetables?.filter((timetable: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      timetable.subject.name.toLowerCase().includes(searchLower) ||
      `${timetable.teacher.firstName} ${timetable.teacher.lastName}`.toLowerCase().includes(searchLower) ||
      timetable.topics.some((topic: any) => 
        topic.title.toLowerCase().includes(searchLower) ||
        topic.description?.toLowerCase().includes(searchLower)
      )
    );
  }) || [];

  const exportTimetable = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        studentId,
        format,
        view: "weekly",
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
      });

      const response = await fetch(`/api/student-timetables/export?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-timetable-${format}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="bg-white rounded-lg border">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100"></div>
            ))}
          </div>
          <div className="space-y-px bg-gray-200">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-px">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-20 bg-gray-100"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Weekly Timetable</h2>
          <p className="text-sm text-gray-600">
            {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportTimetable('pdf')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
              >
                Export as PDF
              </button>
              <button
                onClick={() => exportTimetable('excel')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
              >
                Export as Excel
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          {timetableData?.progressStats && (
            <div className="hidden sm:flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>{timetableData.progressStats.lessonsWithTopics}/{timetableData.progressStats.totalLessons} with topics</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject, teacher, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-0 focus:ring-0 text-sm placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              Found {filteredTimetables.length} lesson{filteredTimetables.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="p-3 sm:p-4 text-sm font-semibold text-gray-700 border-r border-gray-200">
            <Clock className="w-4 h-4 inline mr-2" />
            Time
          </div>
          {daysOfWeek.map((day) => (
            <div key={day.key} className="p-3 sm:p-4 text-sm font-semibold text-gray-700 text-center border-r border-gray-200 last:border-r-0">
              <span className="hidden sm:inline">{day.fullLabel}</span>
              <span className="sm:hidden">{day.label}</span>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
              {/* Time Column */}
              <div className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-600 bg-gray-50/50 border-r border-gray-200 flex items-center justify-center">
                {timeSlot}
              </div>

              {/* Day Columns */}
              {daysOfWeek.map((day) => {
                const timetable = getTimetableForDayAndTime(day.key, timeSlot);
                const isCurrent = isCurrentLesson(timetable);
                const isUpcoming = isUpcomingLesson(timetable);
                const isHighlighted = searchTerm && timetable && (
                  timetable.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  `${timetable.teacher.firstName} ${timetable.teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  timetable.topics.some((topic: any) => 
                    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                );

                return (
                  <div
                    key={day.key}
                    className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[60px] sm:min-h-[80px] relative ${
                      timetable ? "cursor-pointer hover:bg-blue-50/50 transition-colors" : ""
                    } ${isCurrent ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm" : ""} ${
                      isUpcoming ? "bg-yellow-50 border-l-4 border-l-yellow-500" : ""
                    } ${isHighlighted ? "ring-2 ring-blue-300 bg-blue-50" : ""}`}
                    onClick={() => timetable && handleLessonClick(timetable)}
                  >
                    {timetable ? (
                      <div className="space-y-1 h-full flex flex-col">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate leading-tight">
                            {timetable.subject.name}
                          </h4>
                          <div className="flex items-center gap-1 ml-1">
                            {timetable.topics.length > 0 && (
                              <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            )}
                            {isCurrent && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-600 truncate">
                          <User className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{timetable.teacher.firstName} {timetable.teacher.lastName}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{timetable.roomNumber}</span>
                        </div>

                        <div className="flex-1 flex items-end justify-between mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            timetable.status === "ACTIVE" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {timetable.status}
                          </span>
                          
                          {isCurrent && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-100 px-1.5 py-0.5 rounded">
                              Now
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-1.5 py-0.5 rounded">
                              Next
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300">
                        <span className="text-xs">—</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Lessons Summary - Mobile Optimized */}
      {timeFilter === "current" && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {timetableData?.timetables?.filter((t: any) => 
                new Date(t.fullDate).toDateString() === new Date().toDateString()
              ).length || 0} lessons
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {timetableData?.timetables
              ?.filter((t: any) => new Date(t.fullDate).toDateString() === new Date().toDateString())
              ?.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              ?.map((timetable: any) => (
                <div
                  key={timetable.id}
                  className={`bg-white rounded-lg p-4 border-2 cursor-pointer hover:shadow-md transition-all duration-200 ${
                    isCurrentLesson(timetable) ? "border-blue-500 shadow-lg ring-2 ring-blue-200" : 
                    isUpcomingLesson(timetable) ? "border-yellow-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleLessonClick(timetable)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 truncate">{timetable.subject.name}</h4>
                    <div className="flex items-center gap-2">
                      {isCurrentLesson(timetable) && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                          Live
                        </span>
                      )}
                      {isUpcomingLesson(timetable) && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          Next
                        </span>
                      )}
                      {timetable.topics.length > 0 && (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {new Date(timetable.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })} - {new Date(timetable.endTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{timetable.teacher.firstName} {timetable.teacher.lastName}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">
                        {timetable.roomNumber} {timetable.buildingName && `(${timetable.buildingName})`}
                      </span>
                    </div>
                  </div>

                  {timetable.topics.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600 font-medium">
                          {timetable.topics.length} topic{timetable.topics.length > 1 ? 's' : ''} available
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>

          {timetableData?.timetables?.filter((t: any) => 
            new Date(t.fullDate).toDateString() === new Date().toDateString()
          ).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No lessons today</p>
              <p className="text-sm">Enjoy your free day!</p>
            </div>
          )}
        </div>
      )}

      {/* Lesson Topic Modal */}
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

export default StudentWeeklyTimetable;
