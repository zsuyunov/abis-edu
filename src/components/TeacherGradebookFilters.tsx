"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherGradebookFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  currentView: string;
  availableFilters: any;
  isMobile: boolean;
  teacherId: string;
  onTeacherDataUpdate: (data: any) => void;
}

const TeacherGradebookFilters = ({
  filters,
  onFilterChange,
  currentView,
  availableFilters,
  isMobile,
  teacherId,
  onTeacherDataUpdate,
}: TeacherGradebookFiltersProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, [teacherId, filters.branchId, filters.academicYearId, filters.classId]);

  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        view: "overview",
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
      });

      const response = await fetch(`/api/teacher-grades?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        onTeacherDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    
    // Reset dependent filters
    if (field === "branchId") {
      newFilters.academicYearId = "";
      newFilters.classId = "";
      newFilters.subjectId = "";
      newFilters.examId = "";
    } else if (field === "academicYearId") {
      newFilters.classId = "";
      newFilters.subjectId = "";
      newFilters.examId = "";
    } else if (field === "classId") {
      newFilters.subjectId = "";
      newFilters.examId = "";
    } else if (field === "subjectId") {
      newFilters.examId = "";
    }

    onFilterChange(newFilters);
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
        // Approximate term dates (can be customized)
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

  const clearFilters = () => {
    onFilterChange({
      branchId: "",
      academicYearId: "",
      classId: "",
      subjectId: "",
      examId: "",
      gradeType: "",
      startDate: "",
      endDate: "",
      studentId: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* PRIMARY FILTERS */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* BRANCH FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <select
            value={filters.branchId}
            onChange={(e) => handleFilterChange("branchId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            disabled={loading}
          >
            <option value="">All Branches</option>
            {availableFilters.availableBranches?.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* ACADEMIC YEAR FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Year
          </label>
          <select
            value={filters.academicYearId}
            onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            disabled={loading}
          >
            <option value="">All Academic Years</option>
            {availableFilters.availableAcademicYears?.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* CLASS FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class {currentView === "grade-input" && <span className="text-red-500">*</span>}
          </label>
          <select
            value={filters.classId}
            onChange={(e) => handleFilterChange("classId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select Class</option>
            {availableFilters.availableClasses?.map((classItem: any) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        {/* SUBJECT FILTER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject {currentView === "grade-input" && <span className="text-red-500">*</span>}
          </label>
          <select
            value={filters.subjectId}
            onChange={(e) => handleFilterChange("subjectId", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select Subject</option>
            {availableFilters.availableSubjects?.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECONDARY FILTERS */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {/* EXAM FILTER (for exam result input) */}
        {currentView === "exam-input" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.examId}
              onChange={(e) => handleFilterChange("examId", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select Exam</option>
              {availableFilters.availableExams?.map((exam: any) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} - {exam.subject.name} ({new Date(exam.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* GRADE TYPE FILTER */}
        {(currentView === "overview" || currentView === "grade-input" || currentView === "analytics") && (
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

        {/* STUDENT FILTER (for detailed view) */}
        {currentView === "analytics" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student
            </label>
            <select
              value={filters.studentId}
              onChange={(e) => handleFilterChange("studentId", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
              disabled={loading}
            >
              <option value="">All Students</option>
              {availableFilters.availableStudents?.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* DATE RANGE FILTERS */}
        {(currentView === "overview" || currentView === "analytics") && (
          <>
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
          </>
        )}
      </div>

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
          
          {filters.branchId && availableFilters.availableBranches && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Branch: {availableFilters.availableBranches.find((b: any) => b.id.toString() === filters.branchId)?.name}
              <button
                onClick={() => handleFilterChange("branchId", "")}
                className="ml-1 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.classId && availableFilters.availableClasses && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Class: {availableFilters.availableClasses.find((c: any) => c.id.toString() === filters.classId)?.name}
              <button
                onClick={() => handleFilterChange("classId", "")}
                className="ml-1 hover:text-green-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.subjectId && availableFilters.availableSubjects && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Subject: {availableFilters.availableSubjects.find((s: any) => s.id.toString() === filters.subjectId)?.name}
              <button
                onClick={() => handleFilterChange("subjectId", "")}
                className="ml-1 hover:text-purple-600"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.gradeType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Type: {filters.gradeType}
              <button
                onClick={() => handleFilterChange("gradeType", "")}
                className="ml-1 hover:text-orange-600"
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

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lamaSky"></div>
          <span className="ml-2 text-sm text-gray-600">Loading filter options...</span>
        </div>
      )}
    </div>
  );
};

export default TeacherGradebookFilters;
