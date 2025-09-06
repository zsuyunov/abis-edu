"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import TeacherWeeklyTimetable from "./TeacherWeeklyTimetable";
import TeacherTimetableCalendar from "./TeacherTimetableCalendar";
import TeacherTimetableAnalytics from "./TeacherTimetableAnalytics";
import TeacherTimetableFilters from "./TeacherTimetableFilters";
import TimetableExportModal from "./TimetableExportModal";

type ViewType = "weekly" | "monthly" | "yearly" | "calendar" | "analytics";

interface TeacherTimetableContainerProps {
  teacherId: string;
}

const TeacherTimetableContainer = ({ teacherId }: TeacherTimetableContainerProps) => {
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
    <div className="bg-white rounded-md p-4">
      {/* VIEW SELECTOR */}
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
            onClick={() => handleViewChange("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "analytics"
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Analytics
          </button>
        </div>
        
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* FILTERS */}
      <TeacherTimetableFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        currentView={currentView}
      />

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "weekly" && (
          <TeacherWeeklyTimetable
            teacherId={teacherId}
            filters={filters}
            dateRange={dateRange}
          />
        )}
        
        {(currentView === "monthly" || currentView === "yearly" || currentView === "calendar") && (
          <TeacherTimetableCalendar
            teacherId={teacherId}
            filters={filters}
            view={currentView}
            dateRange={dateRange}
          />
        )}
        
        {currentView === "analytics" && (
          <TeacherTimetableAnalytics
            teacherId={teacherId}
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
  );
};

export default TeacherTimetableContainer;
