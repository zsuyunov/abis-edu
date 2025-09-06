"use client";

import { useState, useEffect } from "react";

interface StudentAttendanceFiltersProps {
  filters: any;
  timeFilter: string;
  onFilterChange: (filters: any) => void;
  currentView: string;
  availableFilters: any;
  isMobile: boolean;
  studentId: string;
  onDataUpdate: (data: any) => void;
}

const StudentAttendanceFilters = ({
  filters,
  timeFilter,
  onFilterChange,
  currentView,
  availableFilters,
  isMobile,
  studentId,
  onDataUpdate,
}: StudentAttendanceFiltersProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [studentId, filters.academicYearId, timeFilter]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId,
        timeFilter,
        view: currentView,
        ...filters,
      });

      const response = await fetch(`/api/student-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        onDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    onFilterChange({ [field]: value });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const setDateRange = (range: "thisWeek" | "thisMonth" | "lastMonth" | "thisTerm") => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case "thisWeek":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisTerm":
        // Approximate term dates - adjust based on your academic calendar
        const currentMonth = today.getMonth();
        if (currentMonth >= 8 || currentMonth <= 0) { // Sep-Jan (Fall term)
          startDate = new Date(today.getFullYear(), 8, 1); // September 1
          endDate = new Date(today.getFullYear() + 1, 0, 31); // January 31
        } else if (currentMonth <= 5) { // Feb-May (Spring term)
          startDate = new Date(today.getFullYear(), 1, 1); // February 1
          endDate = new Date(today.getFullYear(), 4, 31); // May 31
        } else { // Jun-Aug (Summer term)
          startDate = new Date(today.getFullYear(), 5, 1); // June 1
          endDate = new Date(today.getFullYear(), 7, 31); // August 31
        }
        break;
    }

    onFilterChange({
      startDate: formatDateForInput(startDate),
      endDate: formatDateForInput(endDate),
    });
  };

  const clearFilters = () => {
    onFilterChange({
      academicYearId: "",
      subjectId: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* PRIMARY FILTERS */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {/* ACADEMIC YEAR FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Year
          </label>
          <select
            value={filters.academicYearId}
            onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">
              {timeFilter === "current" ? "Current Academic Year" : "Select Academic Year"}
            </option>
            {availableFilters.availableAcademicYears?.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* SUBJECT FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={filters.subjectId}
            onChange={(e) => handleFilterChange("subjectId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subjects</option>
            {availableFilters.subjects?.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* CLEAR FILTERS */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* DATE RANGE FILTERS (FOR DETAILED VIEWS) */}
      {(currentView === "charts" || currentView === "records") && (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* QUICK DATE SELECTORS */}
      {(currentView === "charts" || currentView === "records") && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center">Quick select:</span>
          <button
            onClick={() => setDateRange("thisWeek")}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            This Week
          </button>
          <button
            onClick={() => setDateRange("thisMonth")}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => setDateRange("lastMonth")}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            Last Month
          </button>
          <button
            onClick={() => setDateRange("thisTerm")}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
          >
            This Term
          </button>
        </div>
      )}

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <span className="animate-spin">⏳</span>
            Loading attendance data...
          </div>
        </div>
      )}

      {/* FILTER INFO */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        💡 Your attendance data is automatically filtered to your assigned branch and class. 
        {timeFilter === "current" && " Currently showing data for the active academic year."}
        {timeFilter === "past" && " Select a past academic year to view historical records."}
        {currentView === "overview" && " Use the filters above to focus on specific subjects or time periods."}
        {currentView === "charts" && " Charts will update based on your selected filters and date ranges."}
        {currentView === "records" && " Use date ranges to view specific periods in detail."}
        {currentView === "export" && " Filters will be applied to your exported reports."}
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          🎯 <strong>Remember:</strong> Regular attendance (85%+) is key to academic success!
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceFilters;
