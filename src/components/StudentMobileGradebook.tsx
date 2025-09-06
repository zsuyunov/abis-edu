"use client";

import React from "react";

interface StudentMobileGradebookProps {
  gradebookData: any;
  examResults: any[];
  analyticsData: any;
  onViewChange: (view: string) => void;
}

const StudentMobileGradebook = ({
  gradebookData,
  examResults,
  analyticsData,
  onViewChange,
}: StudentMobileGradebookProps) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Mobile Gradebook</h2>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">Mobile-optimized view of your grades</p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Touch-friendly grade cards</li>
            <li>Swipeable subject views</li>
            <li>Quick performance summary</li>
            <li>Mobile charts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentMobileGradebook;
