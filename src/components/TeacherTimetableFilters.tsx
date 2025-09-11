"use client";

import { useState } from "react";
import {
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Building,
  Users,
  BookOpen,
  GraduationCap
} from "lucide-react";

interface TeacherTimetableFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (start: Date, end: Date) => void;
  currentView: string;
  relatedData: {
    branches: any[];
    classes: any[];
    subjects: any[];
    supervisedClasses: any[];
  };
}

const TeacherTimetableFilters = ({
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  currentView,
  relatedData,
}: TeacherTimetableFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use the passed relatedData
  const branches = relatedData.branches || [];
  const classes = relatedData.classes || [];
  const subjects = relatedData.subjects || [];
  
  // Extract unique academic years from classes
  const academicYears = Array.from(
    new Set(classes.map((cls: any) => cls.academicYear?.id).filter(Boolean))
  ).map(id => classes.find((cls: any) => cls.academicYear?.id === id)?.academicYear)
  .filter(Boolean);

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleDateChange = (key: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    if (key === 'start') {
      onDateRangeChange(newDate, dateRange.end);
    } else {
      onDateRangeChange(dateRange.start, newDate);
    }
  };

  const resetFilters = () => {
    onFilterChange({
      branchId: "",
      academicYearId: "",
      classId: "",
      subjectId: "",
      status: "",
      search: "",
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value !== "").length;
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg">
      {/* Filter Header */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <p className="text-sm text-gray-600">
                Filter your assigned timetables and subjects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getActiveFilterCount() > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{getActiveFilterCount()} active</span>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              <span>{isExpanded ? "Less" : "More"} Filters</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filters - Always Visible */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search subjects, classes..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
            />
          </div>

          {/* Branch Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Branch
            </label>
            <select
              value={filters.branchId || ""}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
            >
              <option value="">All Assigned Branches</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName} - {branch.legalName}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Class
            </label>
            <select
              value={filters.classId || ""}
              onChange={(e) => handleFilterChange("classId", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
            >
              <option value="">All Assigned Classes</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.branch?.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Subject
            </label>
            <select
              value={filters.subjectId || ""}
              onChange={(e) => handleFilterChange("subjectId", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
            >
              <option value="">All Assigned Subjects</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200/50">
          <div className="pt-6 space-y-6">
            {/* Date Range */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Academic Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Academic Year
                </label>
                <select
                  value={filters.academicYearId || ""}
                  onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map((year: any) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Day Filter (for weekly view) */}
              {currentView === "weekly" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Day</label>
                  <select
                    value={filters.day || ""}
                    onChange={(e) => handleFilterChange("day", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-colors text-sm"
                  >
                    <option value="">All Days</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
              )}
            </div>

            {/* Quick Filter Presets */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Presets</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDateChange('start', new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                    onDateRangeChange(weekStart, weekEnd);
                  }}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    onDateRangeChange(monthStart, monthEnd);
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  This Month
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetableFilters;