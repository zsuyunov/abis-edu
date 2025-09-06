"use client";

import { useState, useEffect } from "react";

interface ParentAttendanceChartsProps {
  parentId: string;
  selectedChild: any;
  filters: any;
  timeFilter: string;
  attendanceData: any;
  view?: string;
  onDataUpdate: (data: any) => void;
}

const ParentAttendanceCharts = ({
  parentId,
  selectedChild,
  filters,
  timeFilter,
  attendanceData,
  view = "charts",
  onDataUpdate,
}: ParentAttendanceChartsProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      fetchAnalyticsData();
    }
  }, [selectedChild.id, filters, timeFilter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        childId: selectedChild.id,
        timeFilter,
        view: "analytics",
        includeClassAverage: filters.includeClassAverage?.toString() || "false",
        ...filters,
      });

      const response = await fetch(`/api/parent-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        onDataUpdate({ ...attendanceData, analytics: data.analytics });
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📊</div>
        <div className="text-gray-600">Loading {selectedChild.firstName}'s attendance analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Charts Coming Soon</h3>
        <p className="text-gray-600 mb-4">
          Advanced charts and analytics for {selectedChild.firstName}'s attendance are being developed.
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
          💡 <strong>Coming Features:</strong> Attendance trends, class comparisons, subject performance charts, and monthly progress tracking.
        </div>
      </div>
    </div>
  );
};

export default ParentAttendanceCharts;
