"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Clock, MapPin, User } from "lucide-react";
import LessonTopicViewer from "./LessonTopicViewer";

interface StudentTimetableTermlyProps {
  studentId: string;
  filters: any;
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentTimetableTermly = ({ 
  studentId, 
  filters, 
  timeFilter,
  onStudentDataUpdate 
}: StudentTimetableTermlyProps) => {
  const [currentTerm, setCurrentTerm] = useState(1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [termStats, setTermStats] = useState({
    totalClasses: 0,
    completedTopics: 0,
    subjects: [],
    attendance: 0
  });

  const terms = [
    { id: 1, name: "First Term", months: [9, 10, 11, 12] },
    { id: 2, name: "Second Term", months: [1, 2, 3, 4] },
    { id: 3, name: "Third Term", months: [5, 6, 7, 8] }
  ];

  useEffect(() => {
    fetchTermlyTimetables();
  }, [studentId, currentTerm, currentYear, timeFilter, filters]);

  const fetchTermlyTimetables = async () => {
    try {
      setLoading(true);
      
      // Calculate term date range
      const term = terms.find(t => t.id === currentTerm);
      if (!term) return;

      const startMonth = Math.min(...term.months);
      const endMonth = Math.max(...term.months);
      
      let startYear = currentYear;
      let endYear = currentYear;
      
      // Adjust years for academic calendar (Sept-Aug)
      if (startMonth >= 9) {
        endYear = currentYear + 1;
      } else {
        startYear = currentYear - 1;
      }

      const startDate = new Date(startYear, startMonth - 1, 1);
      const endDate = new Date(endYear, endMonth, 0); // Last day of month

      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        view: "termly",
        timeFilter,
      });

      const response = await fetch(`/api/student-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
        calculateTermStats(data.timetables || []);
        onStudentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching termly timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTermStats = (termTimetables: any[]) => {
    const subjects = [...new Set(termTimetables.map(t => t.subject.name))];
    const totalTopics = termTimetables.reduce((sum, t) => sum + (t.topics?.length || 0), 0);
    const completedTopics = termTimetables.reduce((sum, t) => 
      sum + (t.topics?.filter((topic: any) => topic.status === "COMPLETED").length || 0), 0
    );

    setTermStats({
      totalClasses: termTimetables.length,
      completedTopics: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      subjects,
      attendance: Math.round(Math.random() * 20 + 80) // Mock attendance
    });
  };

  const navigateTerm = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentTerm > 1) {
        setCurrentTerm(currentTerm - 1);
      } else {
        setCurrentTerm(3);
        setCurrentYear(currentYear - 1);
      }
    } else {
      if (currentTerm < 3) {
        setCurrentTerm(currentTerm + 1);
      } else {
        setCurrentTerm(1);
        setCurrentYear(currentYear + 1);
      }
    }
  };

  const groupTimetablesByWeek = (timetables: any[]) => {
    const weeks: { [key: string]: any[] } = {};
    
    timetables.forEach(timetable => {
      const date = new Date(timetable.fullDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(timetable);
    });

    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
  };

  const formatWeekRange = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const getCurrentTerm = () => {
    return terms.find(t => t.id === currentTerm);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weeklyGroups = groupTimetablesByWeek(timetables);
  const currentTermInfo = getCurrentTerm();

  return (
    <div className="space-y-6">
      {/* TERM NAVIGATION */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTerm("prev")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {currentTermInfo?.name} {currentYear}
          </h2>
          <p className="text-sm text-gray-600">
            Academic Year {currentYear - 1}-{currentYear}
          </p>
          {timeFilter === "past" && (
            <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Archived
            </span>
          )}
        </div>
        
        <button
          onClick={() => navigateTerm("next")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* TERM STATISTICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{termStats.totalClasses}</div>
          <div className="text-sm text-blue-800">Total Classes</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{termStats.completedTopics}%</div>
          <div className="text-sm text-green-800">Topics Completed</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{termStats.subjects.length}</div>
          <div className="text-sm text-purple-800">Subjects</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{termStats.attendance}%</div>
          <div className="text-sm text-orange-800">Attendance</div>
        </div>
      </div>

      {/* SUBJECTS OVERVIEW */}
      {termStats.subjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subjects This Term
          </h3>
          <div className="flex flex-wrap gap-2">
            {termStats.subjects.map((subject, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* WEEKLY BREAKDOWN */}
      {weeklyGroups.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes This Term</h3>
          <p className="text-gray-600">
            {timeFilter === "current" 
              ? "No classes scheduled for this term yet." 
              : "No archived classes found for this term."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule
          </h3>
          
          {weeklyGroups.map(([weekStart, weekTimetables]) => (
            <div key={weekStart} className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h4 className="font-medium text-gray-900">
                  Week of {formatWeekRange(weekStart)}
                </h4>
                <p className="text-sm text-gray-600">
                  {weekTimetables.length} class{weekTimetables.length !== 1 ? 'es' : ''}
                </p>
              </div>
              
              <div className="p-4">
                <div className="grid gap-3">
                  {weekTimetables
                    .sort((a, b) => new Date(a.fullDate + 'T' + a.startTime).getTime() - new Date(b.fullDate + 'T' + b.startTime).getTime())
                    .map((timetable) => (
                    <div
                      key={timetable.id}
                      onClick={() => {
                        setSelectedTimetable(timetable);
                        setShowTopicViewer(true);
                      }}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900 truncate">
                            {timetable.subject.name}
                          </h5>
                          <span className="text-xs text-gray-500">
                            {new Date(timetable.fullDate).toLocaleDateString("en-US", { 
                              weekday: "short", 
                              month: "short", 
                              day: "numeric" 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(timetable.startTime).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{timetable.teacher.firstName} {timetable.teacher.lastName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Room {timetable.roomNumber}</span>
                          </div>
                        </div>
                        
                        {timetable.topics && timetable.topics.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-blue-600">
                              {timetable.topics.length} topic{timetable.topics.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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

export default StudentTimetableTermly;
