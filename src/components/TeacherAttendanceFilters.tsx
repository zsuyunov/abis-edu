"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherAttendanceFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  currentView: string;
  availableFilters: any;
  isMobile: boolean;
  teacherId: string;
  onTeacherDataUpdate: (data: any) => void;
}

const TeacherAttendanceFilters = ({
  filters,
  onFilterChange,
  currentView,
  availableFilters,
  isMobile,
  teacherId,
  onTeacherDataUpdate,
}: TeacherAttendanceFiltersProps) => {
  const [loading, setLoading] = useState(false);
  const [timetables, setTimetables] = useState([]);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, [teacherId, filters.academicYearId, filters.classId, filters.subjectId, filters.date]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        view: currentView,
        ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.date && { date: filters.date }),
      });

      const response = await fetch(`/api/teacher-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        onTeacherDataUpdate(data);
        
        // Update available timetables for the current filters
        setTimetables(data.timetables || []);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
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

  const setDateRange = (range: "today" | "yesterday" | "week" | "month") => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case "today":
        startDate = new Date(today);
        endDate = new Date(today);
        onFilterChange({ date: formatDateForInput(today) });
        return;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday;
        endDate = yesterday;
        onFilterChange({ date: formatDateForInput(yesterday) });
        return;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }

    onFilterChange({
      startDate: formatDateForInput(startDate),
      endDate: formatDateForInput(endDate),
      date: "", // Clear single date when using range
    });
  };

  const handleExport = async (format: 'pdf' | 'excel', reportType: 'daily' | 'weekly' | 'monthly' | 'termly' = 'daily') => {
    try {
      setExportLoading(format);
      
      const queryParams = new URLSearchParams({
        teacherId,
        format,
        reportType,
        ...filters,
      });

      const response = await fetch(`/api/teacher-attendance/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${reportType}_${format === 'pdf' ? 'report.html' : 'report.csv'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(null);
      setShowExportOptions(false);
    }
  };

  const clearFilters = () => {
    onFilterChange({
      academicYearId: "",
      classId: "",
      subjectId: "",
      timetableId: "",
      date: new Date().toISOString().split('T')[0], // Reset to today
      startDate: "",
      endDate: "",
      studentId: "",
      status: "",
    });
  };

  const getFilteredTimetables = () => {
    if (!filters.date) return [];
    
    return timetables.filter((timetable: any) => {
      const timetableDate = new Date(timetable.fullDate).toDateString();
      const filterDate = new Date(filters.date).toDateString();
      return timetableDate === filterDate;
    });
  };

  const filteredTimetables = getFilteredTimetables();

  return (
    <div className="space-y-4">
      {/* PRIMARY FILTERS */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* DATE FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date {currentView === "taking" && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange("date", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* ACADEMIC YEAR FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Year
          </label>
          <select
            value={filters.academicYearId}
            onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Academic Years</option>
            {availableFilters.academicYears?.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* CLASS FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class
          </label>
          <select
            value={filters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Classes</option>
            {availableFilters.classes?.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
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
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Subjects</option>
            {availableFilters.subjects?.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TIMETABLE SELECTOR (FOR TAKING ATTENDANCE) */}
      {currentView === "taking" && filters.date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class Session <span className="text-red-500">*</span>
          </label>
          <select
            value={filters.timetableId}
            onChange={(e) => handleFilterChange("timetableId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select a class session...</option>
            {filteredTimetables.map((timetable: any) => (
              <option key={timetable.id} value={timetable.id}>
                {timetable.subject.name} - {timetable.class.name} ({new Date(timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {new Date(timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })})
              </option>
            ))}
          </select>
          
          {filters.date && filteredTimetables.length === 0 && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
              📅 No classes scheduled for {new Date(filters.date).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* ADDITIONAL FILTERS FOR HISTORY AND ANALYTICS */}
      {(currentView === "history" || currentView === "analytics") && (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* QUICK DATE SELECTORS */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 self-center">Quick select:</span>
        <button
          onClick={() => setDateRange("today")}
          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => setDateRange("yesterday")}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Yesterday
        </button>
        {(currentView === "history" || currentView === "analytics") && (
          <>
            <button
              onClick={() => setDateRange("week")}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange("month")}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              This Month
            </button>
          </>
        )}
      </div>

      {/* EXPORT AND ACTIONS */}
      {(currentView === "history" || currentView === "analytics") && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <Image src="/upload.png" alt="Export" width={16} height={16} />
                Export Report
              </button>
              
              {showExportOptions && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px]">
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-700">Export as PDF:</div>
                    <div className="space-y-1 mt-1">
                      <button
                        onClick={() => handleExport('pdf', 'daily')}
                        disabled={exportLoading === 'pdf'}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        Daily Report
                      </button>
                      <button
                        onClick={() => handleExport('pdf', 'weekly')}
                        disabled={exportLoading === 'pdf'}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        Weekly Report
                      </button>
                      <button
                        onClick={() => handleExport('pdf', 'monthly')}
                        disabled={exportLoading === 'pdf'}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        Monthly Report
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-700">Export as Excel:</div>
                    <div className="space-y-1 mt-1">
                      <button
                        onClick={() => handleExport('excel', 'daily')}
                        disabled={exportLoading === 'excel'}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        Daily Report
                      </button>
                      <button
                        onClick={() => handleExport('excel', 'weekly')}
                        disabled={exportLoading === 'excel'}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        Weekly Report
                      </button>
                      <button
                        onClick={() => handleExport('excel', 'monthly')}
                        disabled={exportLoading === 'excel'}
                        className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 rounded"
                      >
                        Monthly Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear filters
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
        💡 All attendance data is automatically filtered to your assigned branch and subjects. 
        {currentView === "taking" && " Select a date and class session to start taking attendance."}
        {currentView === "history" && " Use date ranges to view historical attendance records."}
        {currentView === "analytics" && " Export detailed reports for meetings and administrative purposes."}
      </div>
    </div>
  );
};

export default TeacherAttendanceFilters;
