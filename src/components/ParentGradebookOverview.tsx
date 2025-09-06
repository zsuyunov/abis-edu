"use client";

import React from "react";

interface ParentGradebookOverviewProps {
  selectedChild: any;
  gradebookData: any;
  filters: any;
  onFilterUpdate: (filters: any) => void;
  onExportReport: (format: string) => void;
}

const ParentGradebookOverview = ({
  selectedChild,
  gradebookData,
  filters,
  onFilterUpdate,
  onExportReport,
}: ParentGradebookOverviewProps) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gradebook Overview</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Gradebook overview for {selectedChild?.firstName} {selectedChild?.lastName}
        </p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Overall grade summary</li>
            <li>Subject-wise performance</li>
            <li>Grade trends over time</li>
            <li>Comparison with class averages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentGradebookOverview;
