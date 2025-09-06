"use client";

import { useState, useEffect } from "react";
import StudentWeeklyTimetable from "./StudentWeeklyTimetable";
import StudentTimetableCalendar from "./StudentTimetableCalendar";
import StudentTimetableProgress from "./StudentTimetableProgress";
import StudentTimetableFilters from "./StudentTimetableFilters";
import StudentMobileTodayView from "./StudentMobileTodayView";
import StudentTimetableTermly from "./StudentTimetableTermly";
import StudentTimetableYearly from "./StudentTimetableYearly";
import StudentCalendarSync from "./StudentCalendarSync";
import StudentTimetableNotifications from "./StudentTimetableNotifications";

type ViewType = "weekly" | "monthly" | "termly" | "yearly" | "calendar" | "progress" | "today";
type TimeFilterType = "current" | "past";

interface StudentTimetableContainerProps {
  studentId: string;
}

const StudentTimetableContainer = ({ studentId }: StudentTimetableContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("weekly");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("current");
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    academicYearId: "",
    subjectId: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const [studentData, setStudentData] = useState<any>(null);
  const [availableAcademicYears, setAvailableAcademicYears] = useState([]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set default view for mobile
  useEffect(() => {
    if (isMobile && currentView !== "today") {
      setCurrentView("today");
    }
  }, [isMobile]);

  // Set default date range based on view
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    switch (currentView) {
      case "weekly":
        setDateRange({ start: startOfWeek, end: endOfWeek });
        break;
      case "monthly":
        setDateRange({ start: startOfMonth, end: endOfMonth });
        break;
      case "termly":
        // Approximate term dates - can be customized
        const startOfTerm = new Date(today.getFullYear(), Math.floor(today.getMonth() / 4) * 4, 1);
        const endOfTerm = new Date(today.getFullYear(), (Math.floor(today.getMonth() / 4) + 1) * 4 - 1, 0);
        setDateRange({ start: startOfTerm, end: endOfTerm });
        break;
      case "yearly":
        setDateRange({ start: startOfYear, end: endOfYear });
        break;
      case "today":
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        setDateRange({ start: today, end: endOfToday });
        break;
      default:
        setDateRange({ start: startOfWeek, end: endOfWeek });
    }
  }, [currentView]);

  // Update filters with date range
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      startDate: dateRange.start.toISOString().split('T')[0],
      endDate: dateRange.end.toISOString().split('T')[0],
    }));
  }, [dateRange]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleTimeFilterChange = (filter: TimeFilterType) => {
    setTimeFilter(filter);
    // Reset academic year filter when switching between current/past
    setFilters(prev => ({ ...prev, academicYearId: "" }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  const handleStudentDataUpdate = (data: any) => {
    setStudentData(data.student);
    setAvailableAcademicYears(data.availableAcademicYears);
  };

  return (
    <div className="bg-white rounded-md p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
          
          {/* CURRENT/PAST TOGGLE */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTimeFilterChange("current")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFilter === "current"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Current
            </button>
            <button
              onClick={() => handleTimeFilterChange("past")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFilter === "past"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Past
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* NOTIFICATIONS */}
          <StudentTimetableNotifications 
            studentId={studentId}
            onNotificationClick={(notification) => {
              // Handle notification click - could navigate to specific timetable
              console.log('Notification clicked:', notification);
            }}
          />
          
          {/* STUDENT INFO */}
          {studentData && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{studentData.firstName} {studentData.lastName}</span>
              {studentData.class && (
                <span className="ml-2">• Class {studentData.class.name}</span>
              )}
              {studentData.currentAcademicYear && (
                <span className="ml-2">• {studentData.currentAcademicYear.name}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VIEW SELECTOR (DESKTOP) */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewChange("weekly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "weekly"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => handleViewChange("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "monthly"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => handleViewChange("termly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "termly"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Termly
            </button>
            <button
              onClick={() => handleViewChange("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "yearly"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => handleViewChange("calendar")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "calendar"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => handleViewChange("progress")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "progress"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Progress
            </button>
          </div>
        </div>
      )}

      {/* MOBILE VIEW SELECTOR */}
      {isMobile && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => handleViewChange("today")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "today"
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleViewChange("weekly")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "weekly"
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => handleViewChange("progress")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "progress"
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Progress
          </button>
        </div>
      )}

      {/* FILTERS */}
      <StudentTimetableFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        currentView={currentView}
        timeFilter={timeFilter}
        availableAcademicYears={availableAcademicYears}
        isMobile={isMobile}
      />

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "today" && isMobile && (
          <StudentMobileTodayView
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "weekly" && (
          <StudentWeeklyTimetable
            studentId={studentId}
            filters={filters}
            dateRange={dateRange}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "termly" && (
          <StudentTimetableTermly
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "yearly" && (
          <StudentTimetableYearly
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {(currentView === "monthly" || currentView === "calendar") && (
          <StudentTimetableCalendar
            studentId={studentId}
            filters={filters}
            view={currentView}
            dateRange={dateRange}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "progress" && (
          <div className="space-y-6">
            <StudentTimetableProgress
              studentId={studentId}
              filters={filters}
              timeFilter={timeFilter}
              onStudentDataUpdate={handleStudentDataUpdate}
            />
            
            {/* CALENDAR SYNC */}
            <StudentCalendarSync
              studentId={studentId}
              timetableData={studentData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetableContainer;
