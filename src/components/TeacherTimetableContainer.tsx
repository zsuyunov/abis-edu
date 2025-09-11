"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  BarChart3, 
  Grid3X3, 
  CalendarDays, 
  CalendarRange,
  Download,
  Filter,
  ChevronDown,
  BookOpen,
  Sparkles,
  Clock
} from "lucide-react";
import TeacherWeeklyTimetable from "./TeacherWeeklyTimetable";
import TeacherMonthlyTimetable from "./TeacherMonthlyTimetable";
import TeacherTimetableCalendar from "./TeacherTimetableCalendar";
import TeacherTimetableAnalytics from "./TeacherTimetableAnalytics";
import TeacherTimetableFilters from "./TeacherTimetableFilters";
import TimetableExportModal from "./TimetableExportModal";
import { AccessControlProvider, useAccessControl } from "./AccessControlProvider";

type ViewType = "weekly" | "monthly" | "yearly" | "calendar" | "analytics";

interface TeacherTimetableContainerProps {
  teacherId: string;
  teacherData: any;
  relatedData: {
    branches: any[];
    classes: any[];
    subjects: any[];
    supervisedClasses: any[];
  };
}

const TeacherTimetableContainerInner = ({ teacherId, teacherData, relatedData }: TeacherTimetableContainerProps) => {
  const { canViewAnalytics, canExportData, isTeacher, isSupervisor } = useAccessControl();
  const [currentView, setCurrentView] = useState<ViewType>("weekly");
  const [filters, setFilters] = useState({
    branchId: "",
    academicYearId: "",
    classId: "",
    subjectId: "",
    startDate: "",
    endDate: "",
  });
  
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [showExportModal, setShowExportModal] = useState(false);

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
      case "yearly":
        setDateRange({ start: startOfYear, end: endOfYear });
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

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Timetable
                </h1>
                <p className="text-blue-600 font-medium">Teaching schedule & lesson management</p>
              </div>
            </div>
          </div>
          
          {canExportData("own") && (
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              <Download className="w-5 h-5" />
              Export Timetable
            </button>
          )}
        </div>

        {/* VIEW SELECTOR */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleViewChange("weekly")}
                className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === "weekly"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Weekly View
                {currentView === "weekly" && <Sparkles className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleViewChange("monthly")}
                className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === "monthly"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Monthly View
                {currentView === "monthly" && <Sparkles className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleViewChange("yearly")}
                className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === "yearly"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Yearly View
                {currentView === "yearly" && <Sparkles className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleViewChange("calendar")}
                className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentView === "calendar"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105"
                }`}
              >
                <Clock className="w-4 h-4" />
                Calendar Mode
                {currentView === "calendar" && <Sparkles className="w-3 h-3" />}
              </button>
              {canViewAnalytics("own") && (
                <button
                  onClick={() => handleViewChange("analytics")}
                  className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    currentView === "analytics"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                  {currentView === "analytics" && <Sparkles className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <TeacherTimetableFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          currentView={currentView}
          relatedData={relatedData}
        />

        {/* CONTENT */}
        <div className="space-y-6">
          {currentView === "weekly" && (
            <TeacherWeeklyTimetable
              teacherId={teacherId}
              teacherData={teacherData}
              relatedData={relatedData}
              filters={filters}
              dateRange={dateRange}
            />
          )}
          
          {(currentView === "monthly" || currentView === "yearly" || currentView === "calendar") && (
            <TeacherTimetableCalendar
              teacherId={teacherId}
              teacherData={teacherData}
              relatedData={relatedData}
              filters={filters}
              view={currentView}
              dateRange={dateRange}
            />
          )}
          
          {currentView === "analytics" && canViewAnalytics("own") && (
            <TeacherTimetableAnalytics
              teacherId={teacherId}
              teacherData={teacherData}
              relatedData={relatedData}
              filters={filters}
            />
          )}
        </div>

        {/* EXPORT MODAL */}
        {showExportModal && (
          <TimetableExportModal
            teacherId={teacherId}
            filters={filters}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Wrapper component with AccessControlProvider
const TeacherTimetableContainer = (props: TeacherTimetableContainerProps) => {
  return (
    <AccessControlProvider userId={props.teacherId}>
      <TeacherTimetableContainerInner {...props} />
    </AccessControlProvider>
  );
};

export default TeacherTimetableContainer;
