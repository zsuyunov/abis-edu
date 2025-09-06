"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherTimetableFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (start: Date, end: Date) => void;
  currentView: string;
}

const TeacherTimetableFilters = ({
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  currentView,
}: TeacherTimetableFiltersProps) => {
  const [branches, setBranches] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch branches
        const branchesRes = await fetch("/api/branches");
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json();
          setBranches(branchesData.branches || []);
        }

        // Fetch academic years
        const academicYearsRes = await fetch("/api/academic-years");
        if (academicYearsRes.ok) {
          const academicYearsData = await academicYearsRes.json();
          setAcademicYears(academicYearsData.academicYears || []);
        }

        // Fetch classes (teacher-assigned only)
        const classesRes = await fetch("/api/classes");
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(classesData.classes || []);
        }

        // Fetch subjects (teacher-assigned only)
        const subjectsRes = await fetch("/api/subjects");
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData.subjects || []);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

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
      branchId: "",
      academicYearId: "",
      classId: "",
      subjectId: "",
    });
  };

  const exportTimetable = async (format: "pdf" | "excel") => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        format,
        view: currentView,
      });

      const response = await fetch(`/api/teacher-timetables/export?${queryParams}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timetable.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting timetable:", error);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Filters & Settings</h3>
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
          {/* DATE RANGE */}
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
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.branchId}
              onChange={(e) => onFilterChange({ branchId: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
            >
              <option value="">All Branches</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>

            <select
              value={filters.academicYearId}
              onChange={(e) => onFilterChange({ academicYearId: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year: any) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>

            <select
              value={filters.classId}
              onChange={(e) => onFilterChange({ classId: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lamaSky"
            >
              <option value="">All Classes</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

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

          {/* ACTIONS */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => exportTimetable("pdf")}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <Image src="/upload.png" alt="Export" width={16} height={16} />
                Export PDF
              </button>
              <button
                onClick={() => exportTimetable("excel")}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Image src="/upload.png" alt="Export" width={16} height={16} />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetableFilters;
