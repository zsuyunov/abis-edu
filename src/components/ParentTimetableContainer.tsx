"use client";

import { useState, useEffect } from "react";
import ParentWeeklyTimetable from "./ParentWeeklyTimetable";
import ParentTimetableCalendar from "./ParentTimetableCalendar";
import ParentTimetableProgress from "./ParentTimetableProgress";
import ParentTimetableFilters from "./ParentTimetableFilters";
import ParentMobileTodayView from "./ParentMobileTodayView";
import ParentMultiChildDashboard from "./ParentMultiChildDashboard";
import ParentTimetableNotifications from "./ParentTimetableNotifications";
import ParentCalendarSync from "./ParentCalendarSync";
import { Calendar, Users, Download, Settings, User, Clock, BookOpen } from "lucide-react";

type ViewType = "weekly" | "monthly" | "termly" | "yearly" | "calendar" | "progress" | "today" | "multi-child";
type TimeFilterType = "current" | "past";

// Define interfaces for better type safety
interface Child {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  class: {
    name: string;
  };
}

interface ParentData {
  firstName: string;
  lastName: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface ParentTimetableContainerProps {
  parentId: string;
}

const ParentTimetableContainer = ({ parentId }: ParentTimetableContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("weekly");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("current");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  
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

  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [availableAcademicYears, setAvailableAcademicYears] = useState<AcademicYear[]>([]);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    if (isMobile && currentView !== "today" && currentView !== "multi-child") {
      setCurrentView("today");
    }
  }, [isMobile, currentView]);

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
      case "multi-child":
        setDateRange({ start: startOfWeek, end: endOfWeek });
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

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

    const selectedChild = children.find(child => child.id === selectedChildId);

  const handleParentDataUpdate = (data: any) => {
    setParentData(data.parent);
    setChildren(data.children);
    setAvailableAcademicYears(data.availableAcademicYears || []);
    
    // Set default child if not selected
    if (!selectedChildId && data.children && data.children.length > 0) {
      setSelectedChildId(data.children[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Family Timetables</h1>
                {parentData && (
                  <p className="text-sm text-gray-600">
                    Welcome, {parentData.firstName} {parentData.lastName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <ParentTimetableNotifications parentId={parentId} children={children} />
              
              {/* Calendar Sync */}
              <button
                onClick={() => setShowCalendarSync(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Calendar Sync"
              >
                <Download className="w-5 h-5" />
              </button>
              
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* Time Filter Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeFilter("current")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeFilter === "current"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Current
                </button>
                <button
                  onClick={() => setTimeFilter("past")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeFilter === "past"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Past
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* MAIN CONTROLS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          {/* Child Selector */}
          {children.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Select Child
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setSelectedChildId("");
                    setCurrentView("multi-child");
                  }}
                  className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedChildId === "" && currentView === "multi-child"
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md"
                      : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedChildId === "" && currentView === "multi-child"
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600"
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">All Children</div>
                    <div className="text-xs text-gray-500">Combined view</div>
                  </div>
                </button>
                
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      if (currentView === "multi-child") {
                        setCurrentView(isMobile ? "today" : "weekly");
                      }
                    }}
                    className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedChildId === child.id
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedChildId === child.id
                        ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                        : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                    }`}>
                      {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {child.firstName} {child.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {child.class?.name || 'No class'} • {child.studentId}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              View Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {(isMobile ? [
                { key: "today", label: "Today", icon: Clock },
                { key: "multi-child", label: "All Kids", icon: Users }
              ] : [
                { key: "weekly", label: "Weekly", icon: Calendar },
                { key: "monthly", label: "Monthly", icon: Calendar },
                { key: "termly", label: "Termly", icon: BookOpen },
                { key: "yearly", label: "Yearly", icon: BookOpen },
                { key: "calendar", label: "Calendar", icon: Calendar },
                { key: "progress", label: "Progress", icon: BookOpen },
                { key: "today", label: "Today", icon: Clock },
                { key: "multi-child", label: "All Kids", icon: Users }
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCurrentView(key as ViewType)}
                  disabled={key === "multi-child" && selectedChildId !== ""}
                  className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentView === key
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md"
                      : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    currentView === key
                      ? "text-blue-600"
                      : "text-gray-500 group-hover:text-blue-600"
                  }`} />
                  <span className={`text-xs font-medium ${
                    currentView === key
                      ? "text-blue-700"
                      : "text-gray-700 group-hover:text-blue-700"
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <ParentTimetableFilters
            filters={filters}
            onFilterChange={setFilters}
            availableAcademicYears={availableAcademicYears}
            timeFilter={timeFilter}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            currentView={currentView}
            isMobile={isMobile}
            selectedChild={selectedChild}
          />
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {currentView === "weekly" && selectedChildId && (
            <ParentWeeklyTimetable
              parentId={parentId}
              childId={selectedChildId}
              filters={filters}
              timeFilter={timeFilter}
              dateRange={dateRange}
              onParentDataUpdate={handleParentDataUpdate}
            />
          )}

          {currentView === "calendar" && selectedChildId && (
            <ParentTimetableCalendar
              parentId={parentId}
              childId={selectedChildId}
              filters={filters}
              timeFilter={timeFilter}
              dateRange={dateRange}
              onParentDataUpdate={handleParentDataUpdate}
              view={currentView}
            />
          )}

          {currentView === "progress" && selectedChildId && (
            <ParentTimetableProgress
              parentId={parentId}
              childId={selectedChildId}
              filters={filters}
              timeFilter={timeFilter}
              onParentDataUpdate={handleParentDataUpdate}
            />
          )}

          {currentView === "today" && selectedChildId && (
            <div className="p-6">
              <ParentMobileTodayView
                parentId={parentId}
                childId={selectedChildId}
                filters={filters}
                timeFilter={timeFilter}
                onParentDataUpdate={handleParentDataUpdate}
              />
            </div>
          )}

          {currentView === "multi-child" && (
            <div className="p-6">
              <ParentMultiChildDashboard
                parentId={parentId}
                filters={filters}
                timeFilter={timeFilter}
                dateRange={dateRange}
                onParentDataUpdate={handleParentDataUpdate}
              />
            </div>
          )}

          {/* Fallback for unsupported views */}
          {!selectedChildId && currentView !== "multi-child" && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a Child</h3>
                <p className="text-gray-600 mb-6">
                  Please select a child from the options above to view their timetable,
                  or choose "All Children" for a combined family view.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Individual view
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Family view
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR SYNC MODAL */}
      {showCalendarSync && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Calendar Sync</h2>
              <button
                onClick={() => setShowCalendarSync(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ParentCalendarSync
                parentId={parentId}
                children={children}
                selectedChildId={selectedChildId}
                timetableData={parentData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentTimetableContainer;
