"use client";

import React from "react";

interface ParentExamResultsProps {
  selectedChild: any;
  examResults: any;
  filters: any;
  onFilterUpdate: (filters: any) => void;
  onExportReport: (format: string) => void;
}

const ParentExamResults = ({
  selectedChild,
  examResults,
  filters,
  onFilterUpdate,
  onExportReport,
}: ParentExamResultsProps) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Exam Results</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Exam results for {selectedChild?.firstName} {selectedChild?.lastName}
        </p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Recent exam results</li>
            <li>Grade breakdown by subject</li>
            <li>Performance trends</li>
            <li>Pass/fail status</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentExamResults;
