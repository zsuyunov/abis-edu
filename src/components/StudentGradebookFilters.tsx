"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StudentGradebookFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  currentView: string;
  timeFilter: "current" | "past";
  availableAcademicYears: any[];
  subjects: any[];
  isMobile: boolean;
  studentId: string;
  onStudentDataUpdate: (data: any) => void;
}

const StudentGradebookFilters = ({
  filters,
  onFilterChange,
  currentView,
  timeFilter,
  availableAcademicYears,
  subjects,
  isMobile,
  studentId,
  onStudentDataUpdate,
}: StudentGradebookFiltersProps) => {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const handleFilterChange = (field: string, value: string) => {
    onFilterChange({ [field]: value });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const setDateRange = (range: "today" | "week" | "month" | "term" | "year") => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case "today":
        startDate = new Date(today);
        endDate = new Date(today);
        break;
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
      case "term":
        // Approximate term dates
        const currentMonth = today.getMonth();
        if (currentMonth < 3) { // Jan-Mar: Term 1
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 2, 31);
        } else if (currentMonth < 6) { // Apr-Jun: Term 2
          startDate = new Date(today.getFullYear(), 3, 1);
          endDate = new Date(today.getFullYear(), 5, 30);
        } else if (currentMonth < 9) { // Jul-Sep: Term 3
          startDate = new Date(today.getFullYear(), 6, 1);
          endDate = new Date(today.getFullYear(), 8, 30);
        } else { // Oct-Dec: Term 4
          startDate = new Date(today.getFullYear(), 9, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
        }
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
    }

    onFilterChange({
      startDate: formatDateForInput(startDate),
      endDate: formatDateForInput(endDate),
    });
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExportLoading(format);
      
      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
        format,
        timeFilter,
      });

      const response = await fetch(`/api/student-gradebook/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `academic_report_${format === 'pdf' ? 'report.html' : 'report.csv'}`;
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
      subjectId: "",
      gradeType: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* PRIMARY FILTERS */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* ACADEMIC YEAR FILTER (ONLY FOR PAST) */}
        {timeFilter === "past" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <select
              value={filters.academicYearId}
              onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            >
              <option value="">Select Academic Year</option>
              {availableAcademicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} ({new Date(year.startDate).getFullYear()}-{new Date(year.endDate).getFullYear()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* SUBJECT FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={filters.subjectId}
            onChange={(e) => handleFilterChange("subjectId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* GRADE TYPE FILTER */}
        {(currentView === "overview" || currentView === "analytics") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Type
            </label>
            <select
              value={filters.gradeType}
              onChange={(e) => handleFilterChange("gradeType", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="TERMLY">Termly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        )}

        {/* EXPORT BUTTON */}
        <div className="flex items-end">
          <div className="relative w-full">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="w-full bg-lamaSky text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Image src="/upload.png" alt="Export" width={16} height={16} />
              Export Report
            </button>
            
            {showExportOptions && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exportLoading === 'pdf'}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
                >
                  {exportLoading === 'pdf' ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Image src="/result.png" alt="PDF" width={14} height={14} />
                  )}
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exportLoading === 'excel'}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm border-t border-gray-100 flex items-center gap-2"
                >
                  {exportLoading === 'excel' ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Image src="/finance.png" alt="Excel" width={14} height={14} />
                  )}
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATE RANGE FILTERS */}
      {(currentView === "overview" || currentView === "analytics") && (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* QUICK DATE RANGES */}
      {(currentView === "overview" || currentView === "analytics") && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center">Quick select:</span>
          <button
            onClick={() => setDateRange("today")}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setDateRange("week")}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            This Week
          </button>
          <button
            onClick={() => setDateRange("month")}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => setDateRange("term")}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            This Term
          </button>
          <button
            onClick={() => setDateRange("year")}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            This Year
          </button>
        </div>
      )}

      {/* ACTIVE FILTERS DISPLAY */}
      {Object.values(filters).some(value => value !== "") && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.academicYearId && availableAcademicYears && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Year: {availableAcademicYears.find((y: any) => y.id.toString() === filters.academicYearId)?.name}
              <button
                onClick={() => handleFilterChange("academicYearId", "")}
                className="ml-1 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.subjectId && subjects && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Subject: {subjects.find((s: any) => s.id.toString() === filters.subjectId)?.name}
              <button
                onClick={() => handleFilterChange("subjectId", "")}
                className="ml-1 hover:text-green-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.gradeType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Type: {filters.gradeType}
              <button
                onClick={() => handleFilterChange("gradeType", "")}
                className="ml-1 hover:text-purple-600"
              >
                ×
              </button>
            </span>
          )}
          
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Date Range: {filters.startDate || "..."} to {filters.endDate || "..."}
              <button
                onClick={() => onFilterChange({ startDate: "", endDate: "" })}
                className="ml-1 hover:text-yellow-600"
              >
                ×
              </button>
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="text-xs text-gray-600 hover:text-gray-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* EXPORT INFO */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        💡 Export your academic report to share with parents or save for your records. 
        PDF format is perfect for printing, while Excel allows for further analysis.
      </div>
    </div>
  );
};

export default StudentGradebookFilters;
