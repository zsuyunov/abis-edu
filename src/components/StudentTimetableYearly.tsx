"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, BookOpen, TrendingUp, Award, Target } from "lucide-react";
import LessonTopicViewer from "./LessonTopicViewer";

interface StudentTimetableYearlyProps {
  studentId: string;
  filters: any;
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentTimetableYearly = ({ 
  studentId, 
  filters, 
  timeFilter,
  onStudentDataUpdate 
}: StudentTimetableYearlyProps) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTopicViewer, setShowTopicViewer] = useState(false);
  const [yearlyStats, setYearlyStats] = useState({
    totalClasses: 0,
    totalTopics: 0,
    completedTopics: 0,
    subjects: [],
    monthlyBreakdown: [],
    termBreakdown: []
  });

  useEffect(() => {
    fetchYearlyTimetables();
  }, [studentId, currentYear, timeFilter, filters]);

  const fetchYearlyTimetables = async () => {
    try {
      setLoading(true);
      
      // Academic year runs from September to August
      const startDate = new Date(currentYear - 1, 8, 1); // September 1st
      const endDate = new Date(currentYear, 7, 31); // August 31st

      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        view: "yearly",
        timeFilter,
      });

      const response = await fetch(`/api/student-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
        calculateYearlyStats(data.timetables || []);
        onStudentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching yearly timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateYearlyStats = (yearTimetables: any[]) => {
    const subjects = [...new Set(yearTimetables.map(t => t.subject.name))];
    const totalTopics = yearTimetables.reduce((sum, t) => sum + (t.topics?.length || 0), 0);
    const completedTopics = yearTimetables.reduce((sum, t) => 
      sum + (t.topics?.filter((topic: any) => topic.status === "COMPLETED").length || 0), 0
    );

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      classes: 0,
      topics: 0,
      completed: 0
    }));

    yearTimetables.forEach(t => {
      const month = new Date(t.fullDate).getMonth();
      monthlyData[month].classes++;
      monthlyData[month].topics += t.topics?.length || 0;
      monthlyData[month].completed += t.topics?.filter((topic: any) => topic.status === "COMPLETED").length || 0;
    });

    // Term breakdown
    const termBreakdown = [
      { 
        name: "First Term", 
        months: [8, 9, 10, 11], // Sep-Dec
        classes: 0, 
        topics: 0, 
        completed: 0 
      },
      { 
        name: "Second Term", 
        months: [0, 1, 2, 3], // Jan-Apr
        classes: 0, 
        topics: 0, 
        completed: 0 
      },
      { 
        name: "Third Term", 
        months: [4, 5, 6, 7], // May-Aug
        classes: 0, 
        topics: 0, 
        completed: 0 
      }
    ];

    termBreakdown.forEach(term => {
      term.months.forEach(month => {
        term.classes += monthlyData[month].classes;
        term.topics += monthlyData[month].topics;
        term.completed += monthlyData[month].completed;
      });
    });

    setYearlyStats({
      totalClasses: yearTimetables.length,
      totalTopics,
      completedTopics,
      subjects,
      monthlyBreakdown: monthlyData,
      termBreakdown
    });
  };

  const navigateYear = (direction: "prev" | "next") => {
    setCurrentYear(prev => direction === "prev" ? prev - 1 : prev + 1);
  };

  const getMonthName = (monthIndex: number) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[monthIndex];
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600 bg-green-100";
    if (percentage >= 80) return "text-blue-600 bg-blue-100";
    if (percentage >= 70) return "text-yellow-600 bg-yellow-100";
    if (percentage >= 60) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const overallCompletion = getCompletionPercentage(yearlyStats.completedTopics, yearlyStats.totalTopics);

  return (
    <div className="space-y-6">
      {/* YEAR NAVIGATION */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateYear("prev")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Academic Year {currentYear - 1}-{currentYear}
          </h2>
          <p className="text-sm text-gray-600">
            September {currentYear - 1} - August {currentYear}
          </p>
          {timeFilter === "past" && (
            <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Archived
            </span>
          )}
        </div>
        
        <button
          onClick={() => navigateYear("next")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* YEARLY OVERVIEW STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{yearlyStats.totalClasses}</div>
          <div className="text-sm text-blue-800">Total Classes</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{yearlyStats.totalTopics}</div>
          <div className="text-sm text-purple-800">Total Topics</div>
        </div>
        
        <div className={`rounded-lg p-4 text-center ${getGradeColor(overallCompletion)}`}>
          <div className="text-3xl font-bold">{overallCompletion}%</div>
          <div className="text-sm">Completion Rate</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{yearlyStats.subjects.length}</div>
          <div className="text-sm text-green-800">Subjects</div>
        </div>
      </div>

      {/* PERFORMANCE GRADE */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Academic Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${overallCompletion >= 90 ? 'text-green-600' : overallCompletion >= 80 ? 'text-blue-600' : overallCompletion >= 70 ? 'text-yellow-600' : 'text-orange-600'}`}>
              {overallCompletion >= 90 ? 'A' : overallCompletion >= 80 ? 'B' : overallCompletion >= 70 ? 'C' : 'D'}
            </div>
            <div className="text-sm text-gray-600">Overall Grade</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {Math.round(yearlyStats.totalClasses / 12)}
            </div>
            <div className="text-sm text-gray-600">Avg Classes/Month</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {yearlyStats.totalTopics > 0 ? Math.round(yearlyStats.totalTopics / yearlyStats.totalClasses) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Topics/Class</div>
          </div>
        </div>
      </div>

      {/* TERM BREAKDOWN */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Term Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {yearlyStats.termBreakdown.map((term, index) => {
            const completion = getCompletionPercentage(term.completed, term.topics);
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{term.name}</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Classes:</span>
                    <span className="font-medium">{term.classes}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Topics:</span>
                    <span className="font-medium">{term.topics}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className={`font-medium ${completion >= 80 ? 'text-green-600' : completion >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {completion}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${completion >= 80 ? 'bg-green-500' : completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${completion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MONTHLY BREAKDOWN CHART */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Monthly Activity</h3>
        </div>
        
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {yearlyStats.monthlyBreakdown.map((month, index) => {
            const completion = getCompletionPercentage(month.completed, month.topics);
            const height = month.classes > 0 ? Math.max(20, (month.classes / Math.max(...yearlyStats.monthlyBreakdown.map(m => m.classes))) * 100) : 20;
            
            return (
              <div key={index} className="text-center">
                <div className="mb-2">
                  <div 
                    className={`mx-auto rounded-t ${month.classes > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                    style={{ height: `${height}px`, width: '100%' }}
                    title={`${month.classes} classes, ${completion}% completed`}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">{getMonthName(index)}</div>
                <div className="text-xs font-medium text-gray-900">{month.classes}</div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Hover over bars to see details
        </div>
      </div>

      {/* SUBJECTS PERFORMANCE */}
      {yearlyStats.subjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Subject Overview</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {yearlyStats.subjects.map((subject, index) => {
              const subjectTimetables = timetables.filter((t: any) => t.subject.name === subject);
              const subjectTopics = subjectTimetables.reduce((sum, t) => sum + (t.topics?.length || 0), 0);
              const subjectCompleted = subjectTimetables.reduce((sum, t) => 
                sum + (t.topics?.filter((topic: any) => topic.status === "COMPLETED").length || 0), 0
              );
              const subjectCompletion = getCompletionPercentage(subjectCompleted, subjectTopics);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-2 truncate" title={subject}>
                    {subject}
                  </h4>
                  <div className="text-xs text-gray-600 mb-1">
                    {subjectTimetables.length} classes
                  </div>
                  <div className={`text-sm font-medium ${subjectCompletion >= 80 ? 'text-green-600' : subjectCompletion >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {subjectCompletion}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full ${subjectCompletion >= 80 ? 'bg-green-500' : subjectCompletion >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${subjectCompletion}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GOALS AND TARGETS */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Academic Goals</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Completion Target</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(overallCompletion, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{overallCompletion}% / 85%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {overallCompletion >= 85 ? "🎉 Target achieved!" : `${85 - overallCompletion}% more to reach target`}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Attendance Goal</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: "92%" }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">92% / 90%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              🎯 Excellent attendance!
            </p>
          </div>
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

export default StudentTimetableYearly;
