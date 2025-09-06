"use client";

import React from "react";

interface ParentGradebookFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  availableAcademicYears: any[];
  subjects: any[];
  selectedChild: any;
  timeFilter: string;
  onTimeFilterChange: (filter: string) => void;
}

const ParentGradebookFilters = ({
  filters,
  onFilterChange,
  availableAcademicYears,
  subjects,
  selectedChild,
  timeFilter,
  onTimeFilterChange,
}: ParentGradebookFiltersProps) => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">Select Academic Year</option>
            {availableAcademicYears.map((year: any) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <select className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">All Subjects</option>
            {subjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md"
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
          >
            <option value="current">Current Year</option>
            <option value="past">Past Years</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ParentGradebookFilters;
