"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Bell,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Sunset
} from "lucide-react";
import LessonTopicViewer from "./LessonTopicViewer";

interface StudentTodayViewProps {
  studentId: string;
  filters: any;
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentTodayView = ({ 
  studentId, 
  filters, 
  timeFilter, 
  onStudentDataUpdate 
}: StudentTodayViewProps) => {
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState<any | null>(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's timetable data
  useEffect(() => {
    fetchTodayTimetable();
  }, [studentId, filters, currentDate, timeFilter]);

  const fetchTodayTimetable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const response = await fetch(`/api/student/timetable/today?studentId=${studentId}&date=${dayStart.toISOString()}&timeFilter=${timeFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimetableData(data);
        onStudentDataUpdate(data.studentInfo);
      }
    } catch (error) {
      console.error('Error fetching today timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson: any) => {
    setSelectedTimetable(lesson);
    setShowTopicViewer(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Touch handlers for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      navigateDate('next');
    }
    if (isRightSwipe) {
      navigateDate('prev');
    }
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const isPastDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return currentDate < today;
  };

  const getCurrentLesson = () => {
    if (!timetableData?.timetables) return null;
    
    const now = currentTime;
    return timetableData.timetables.find((lesson: any) => {
      const startTime = new Date(`${currentDate.toDateString()} ${lesson.startTime}`);
      const endTime = new Date(`${currentDate.toDateString()} ${lesson.endTime}`);
      return now >= startTime && now <= endTime;
    });
  };

  const getNextLesson = () => {
    if (!timetableData?.timetables) return null;
    
    const now = currentTime;
    const upcomingLessons = timetableData.timetables.filter((lesson: any) => {
      const startTime = new Date(`${currentDate.toDateString()} ${lesson.startTime}`);
      return startTime > now;
    });
    
    return upcomingLessons.sort((a: any, b: any) => {
      const timeA = new Date(`${currentDate.toDateString()} ${a.startTime}`);
      const timeB = new Date(`${currentDate.toDateString()} ${b.startTime}`);
      return timeA.getTime() - timeB.getTime();
    })[0];
  };

  const getTimeOfDayIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return <Moon className="w-5 h-5 text-indigo-500" />;
    if (hour < 12) return <Sun className="w-5 h-5 text-yellow-500" />;
    if (hour < 17) return <Coffee className="w-5 h-5 text-orange-500" />;
    if (hour < 20) return <Sunset className="w-5 h-5 text-red-500" />;
    return <Moon className="w-5 h-5 text-indigo-500" />;
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getTimeUntilLesson = (lesson: any) => {
    const now = currentTime;
    const lessonTime = new Date(`${currentDate.toDateString()} ${lesson.startTime}`);
    const diffMs = lessonTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `in ${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `in ${hours}h ${mins}m`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = getCurrentLesson();
  const nextLesson = getNextLesson();

  return (
    <div 
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl space-y-6 select-none"
    >
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateDate('prev')}
          className="p-2 bg-gray-100 hover:bg-white rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center mb-1">
            {getTimeOfDayIcon()}
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {getTimeOfDayGreeting()}
            </h2>
          </div>
          <p className="text-blue-600 font-medium">
            {isToday() ? 'Today' : currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-sm text-gray-500">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </p>
        </div>
        
        <button
          onClick={() => navigateDate('next')}
          className="p-2 bg-gray-100 hover:bg-white rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Current Lesson Card */}
      {currentLesson && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg animate-pulse">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-800">Currently in Class</h3>
              <p className="text-sm text-green-600">Live now</p>
            </div>
          </div>
          
          <div 
            onClick={() => handleLessonClick(currentLesson)}
            className="bg-white/60 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">{currentLesson.subject.name}</h4>
              {currentLesson.timetableTopics?.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  <Eye className="w-3 h-3" />
                  Topics
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span>{currentLesson.teacher.firstName} {currentLesson.teacher.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Room {currentLesson.roomNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>{formatTime(currentLesson.startTime)} - {formatTime(currentLesson.endTime)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Lesson Card */}
      {nextLesson && !currentLesson && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-800">Next Class</h3>
              <p className="text-sm text-blue-600">{getTimeUntilLesson(nextLesson)}</p>
            </div>
          </div>
          
          <div 
            onClick={() => handleLessonClick(nextLesson)}
            className="bg-white/60 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">{nextLesson.subject.name}</h4>
              {nextLesson.timetableTopics?.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  <Eye className="w-3 h-3" />
                  Topics
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <span>{nextLesson.teacher.firstName} {nextLesson.teacher.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Room {nextLesson.roomNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>{formatTime(nextLesson.startTime)} - {formatTime(nextLesson.endTime)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Lessons for Today */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">
            {isToday() ? "Today's Schedule" : "Day's Schedule"}
          </h3>
          <span className="text-sm text-gray-500">
            ({timetableData?.timetables?.length || 0} lessons)
          </span>
        </div>
        
        {!timetableData?.timetables || timetableData.timetables.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">No Classes Today</h4>
            <p className="text-gray-600 text-sm">
              {isToday() ? "Enjoy your free day!" : "No classes scheduled for this day."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {timetableData.timetables.map((lesson: any, index: number) => {
              const isCurrentLesson = currentLesson?.id === lesson.id;
              const isUpcoming = nextLesson?.id === lesson.id;
              const lessonTime = new Date(`${currentDate.toDateString()} ${lesson.startTime}`);
              const isPast = lessonTime < currentTime;
              
              return (
                <div
                  key={index}
                  onClick={() => handleLessonClick(lesson)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isCurrentLesson 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300' 
                      : isUpcoming
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300'
                      : isPast
                      ? 'bg-gray-100 border border-gray-200'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isCurrentLesson ? 'bg-green-500 animate-pulse' :
                        isUpcoming ? 'bg-blue-500' :
                        isPast ? 'bg-gray-400' : 'bg-indigo-400'
                      }`}></div>
                      <h4 className="font-semibold text-gray-900">{lesson.subject.name}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {lesson.timetableTopics?.length > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          <Sparkles className="w-3 h-3" />
                          {lesson.timetableTopics.length}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-600">
                        {formatTime(lesson.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {lesson.teacher.firstName} {lesson.teacher.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Room {lesson.roomNumber}
                      </span>
                    </div>
                    
                    {isCurrentLesson && (
                      <span className="text-green-600 font-medium text-xs">Live now</span>
                    )}
                    {isUpcoming && (
                      <span className="text-blue-600 font-medium text-xs">{getTimeUntilLesson(lesson)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Swipe Hint */}
      <div className="text-center text-xs text-gray-400 py-2">
        👈 Swipe left or right to navigate days 👉
      </div>

      {/* Lesson Topic Viewer Modal */}
      {showTopicViewer && selectedTimetable && (
        <LessonTopicViewer
          timetable={selectedTimetable}
          isReadOnly={timeFilter === "past" || isPastDate()}
          onClose={() => {
            setShowTopicViewer(false);
            setSelectedTimetable(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentTodayView;
