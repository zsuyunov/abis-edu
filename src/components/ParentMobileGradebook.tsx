"use client";

import React from "react";

interface ParentMobileGradebookProps {
  selectedChild: any;
  gradebookData: any;
  examResults: any;
  performanceData: any;
  insights: any;
  onChildChange: (childId: string) => void;
  onViewChange: (view: string) => void;
}

const ParentMobileGradebook = ({
  selectedChild,
  gradebookData,
  examResults,
  performanceData,
  insights,
  onChildChange,
  onViewChange,
}: ParentMobileGradebookProps) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Mobile Gradebook</h2>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600">
          Mobile-optimized gradebook for {selectedChild?.firstName} {selectedChild?.lastName}
        </p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Touch-friendly grade overview</li>
            <li>Swipeable subject cards</li>
            <li>Quick performance summary</li>
            <li>Mobile-optimized charts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentMobileGradebook;
