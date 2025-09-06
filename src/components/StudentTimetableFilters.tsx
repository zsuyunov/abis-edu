"use client";

import { useState } from "react";
import Image from "next/image";

interface StudentTimetableFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (start: Date, end: Date) => void;
  currentView: string;
  timeFilter: "current" | "past";
  availableAcademicYears: any[];
  isMobile: boolean;
}

const StudentTimetableFilters = ({
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  currentView,
  timeFilter,
  availableAcademicYears,
  isMobile,
}: StudentTimetableFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subjects, setSubjects] = useState([]);

  const handleDateChange = (type: "start" | "end", value: string) => {
    const newDate = new Date(value);
    if (type === "start") {
      onDateRangeChange(newDate, dateRange.end);
    } else {
      onDateRangeChange(dateRange.start, newDate);
    }
  };

  const handleQuickDateSelect = (days: number) => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(today.getDate() + days);
    onDateRangeChange(start, end);
  };

  const clearFilters = () => {
    onFilterChange({
      academicYearId: "",
      subjectId: "",
      search: "",
    });
  };

  const exportTimetable = async (format: "pdf" | "excel") => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        format,
        view: currentView,
        timeFilter,
      });

      const response = await fetch(`/api/student-timetables/export?${queryParams}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-timetable.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting timetable:", error);
    }
  };

  const syncToCalendar = (type: "google" | "apple") => {
    // This would typically generate calendar files or redirect to calendar apps
    alert(`Calendar sync with ${type} Calendar coming soon!`);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Filters & Options</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <span>{isExpanded ? "Hide" : "Show"} Filters</span>
          <Image
            src="/filter.png"
            alt="Filter"
            width={16}
            height={16}
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* ACADEMIC YEAR SELECTOR (FOR PAST VIEW) */}
          {timeFilter === "past" && availableAcademicYears.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select
                  value={filters.academicYearId}
                  onChange={(e) => onFilterChange({ academicYearId: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
                >
                  <option value="">Select Academic Year</option>
                  {availableAcademicYears.map((year: any) => (
                    <option key={year.id} value={year.id}>
                      {year.name} ({new Date(year.startDate).getFullYear()}-{new Date(year.endDate).getFullYear()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* DATE RANGE (FOR NON-MOBILE) */}
          {!isMobile && currentView !== "today" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
                />
              </div>
              {timeFilter === "current" && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Quick Select</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickDateSelect(7)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      7 days
                    </button>
                    <button
                      onClick={() => handleQuickDateSelect(30)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      30 days
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEARCH & SUBJECT FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by subject, teacher, or topic..."
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={filters.subjectId}
                onChange={(e) => onFilterChange({ subjectId: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>

            <div className="flex gap-2 flex-wrap">
              {/* EXPORT OPTIONS */}
              <button
                onClick={() => exportTimetable("pdf")}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <Image src="/upload.png" alt="Export" width={16} height={16} />
                PDF
              </button>
              <button
                onClick={() => exportTimetable("excel")}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Image src="/upload.png" alt="Export" width={16} height={16} />
                Excel
              </button>

              {/* CALENDAR SYNC (ONLY FOR CURRENT) */}
              {timeFilter === "current" && (
                <>
                  <button
                    onClick={() => syncToCalendar("google")}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Image src="/calendar.png" alt="Google" width={16} height={16} />
                    Google
                  </button>
                  <button
                    onClick={() => syncToCalendar("apple")}
                    className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center gap-2"
                  >
                    <Image src="/calendar.png" alt="Apple" width={16} height={16} />
                    Apple
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK INFO BAR */}
      {!isExpanded && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {timeFilter === "past" && filters.academicYearId && (
            <span className="flex items-center gap-1">
              <Image src="/calendar.png" alt="Year" width={14} height={14} />
              {availableAcademicYears.find(year => year.id === parseInt(filters.academicYearId))?.name}
            </span>
          )}
          {filters.search && (
            <span className="flex items-center gap-1">
              <Image src="/search.png" alt="Search" width={14} height={14} />
              "{filters.search}"
            </span>
          )}
          {filters.subjectId && (
            <span className="flex items-center gap-1">
              <Image src="/subject.png" alt="Subject" width={14} height={14} />
              Subject filtered
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentTimetableFilters;
