/*
"use client";

import React from "react";

interface ParentPerformanceDashboardProps {
  selectedChild: any;
  performanceData: any;
  filters: any;
  onFilterUpdate: (filters: any) => void;
  onExportReport: (format: string) => void;
}

const ParentPerformanceDashboard = ({
  selectedChild,
  performanceData,
  filters,
  onFilterUpdate,
  onExportReport,
}: ParentPerformanceDashboardProps) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Performance Dashboard</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Performance analytics for {selectedChild?.firstName} {selectedChild?.lastName}
        </p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Performance charts and graphs</li>
            <li>Grade distribution analysis</li>
            <li>Subject comparison</li>
            <li>Improvement recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentPerformanceDashboard;


*/