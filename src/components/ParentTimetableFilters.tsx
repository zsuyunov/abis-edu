/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ParentTimetableFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (start: Date, end: Date) => void;
  currentView: string;
  timeFilter: "current" | "past";
  availableAcademicYears: any[];
  isMobile: boolean;
  selectedChild: any;
}

const ParentTimetableFilters = ({
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  currentView,
  timeFilter,
  availableAcademicYears,
  isMobile,
  selectedChild,
}: ParentTimetableFiltersProps) => {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (selectedChild?.classId) {
      fetchSubjects();
    }
  }, [selectedChild, filters.academicYearId, timeFilter]);

  const fetchSubjects = async () => {
    try {
      const queryParams = new URLSearchParams({
        classId: selectedChild.classId.toString(),
        academicYearId: filters.academicYearId || "",
        timeFilter,
      });

      const response = await fetch(`/api/subjects?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExportLoading(format);
      
      const queryParams = new URLSearchParams({
        parentId: selectedChild?.id || "",
        childId: selectedChild?.id || "",
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        format,
        timeFilter,
      });

      const response = await fetch(`/api/parent-timetables/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedChild?.firstName}_timetable_${format === 'pdf' ? 'schedule.pdf' : 'schedule.xlsx'}`;
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

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    if (field === 'start') {
      onDateRangeChange(newDate, dateRange.end);
    } else {
      onDateRangeChange(dateRange.start, newDate);
    }
  };

  return (
    <div className="space-y-4">
      {/* ACADEMIC YEAR FILTER (ONLY FOR PAST) }
      {timeFilter === "past" && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <select
              value={filters.academicYearId}
              onChange={(e) => onFilterChange({ academicYearId: e.target.value })}
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
        </div>
      )}

      {/* FILTERS ROW }
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* SUBJECT FILTER }
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={filters.subjectId}
            onChange={(e) => onFilterChange({ subjectId: e.target.value })}
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

        {/* DATE RANGE FILTERS }
        {(currentView === "weekly" || currentView === "monthly" || currentView === "calendar") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={formatDateForInput(dateRange.start)}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={formatDateForInput(dateRange.end)}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* EXPORT BUTTON }
        <div className="flex items-end">
          <div className="relative w-full">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="w-full bg-lamaSky text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              disabled={!selectedChild}
            >
              <Image src="/upload.png" alt="Export" width={16} height={16} />
              Export
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

      {/* SEARCH (FOR LARGER VIEWS) }
      {!isMobile && currentView !== "today" && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by subject, teacher, or room..."
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
              />
              <Image 
                src="/search.png" 
                alt="Search" 
                width={16} 
                height={16} 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* QUICK DATE RANGES }
      {currentView === "weekly" && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 self-center">Quick select:</span>
          <button
            onClick={() => {
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay() + 1);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              onDateRangeChange(startOfWeek, endOfWeek);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            This Week
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const startOfNextWeek = new Date(today);
              startOfNextWeek.setDate(today.getDate() - today.getDay() + 8);
              const endOfNextWeek = new Date(startOfNextWeek);
              endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
              onDateRangeChange(startOfNextWeek, endOfNextWeek);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Next Week
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const startOfLastWeek = new Date(today);
              startOfLastWeek.setDate(today.getDate() - today.getDay() - 6);
              const endOfLastWeek = new Date(startOfLastWeek);
              endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
              onDateRangeChange(startOfLastWeek, endOfLastWeek);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Last Week
          </button>
        </div>
      )}

      {/* FILTER STATUS }
      {(filters.subjectId || filters.search || filters.academicYearId) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.subjectId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Subject: {subjects.find((s: any) => s.id.toString() === filters.subjectId)?.name}
              <button
                onClick={() => onFilterChange({ subjectId: "" })}
                className="ml-1 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Search: "{filters.search}"
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="ml-1 hover:text-green-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.academicYearId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Year: {availableAcademicYears.find((y: any) => y.id.toString() === filters.academicYearId)?.name}
              <button
                onClick={() => onFilterChange({ academicYearId: "" })}
                className="ml-1 hover:text-purple-600"
              >
                ×
              </button>
            </span>
          )}
          
          <button
            onClick={() => onFilterChange({ subjectId: "", search: "", academicYearId: "" })}
            className="text-xs text-gray-600 hover:text-gray-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* EXPORT INFO }
      {selectedChild && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          💡 Export {selectedChild.firstName}'s timetable for home study planning. 
          PDF is great for printing, Excel allows you to add your own notes and planning.
        </div>
      )}
    </div>
  );
};

export default ParentTimetableFilters;


*/