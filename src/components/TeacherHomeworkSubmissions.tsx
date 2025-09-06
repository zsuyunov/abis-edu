"use client";

import { useState, useEffect } from "react";

interface TeacherHomeworkSubmissionsProps {
  teacherId: string;
  selectedHomeworkId: number | null;
  filters: any;
  onDataUpdate: (data: any) => void;
  isMobile: boolean;
}

const TeacherHomeworkSubmissions = ({
  teacherId,
  selectedHomeworkId,
  filters,
  onDataUpdate,
  isMobile,
}: TeacherHomeworkSubmissionsProps) => {
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (selectedHomeworkId) {
      fetchSubmissions();
    }
  }, [selectedHomeworkId, filters]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        view: "individual",
        homeworkId: selectedHomeworkId?.toString() || "",
      });

      const response = await fetch(`/api/teacher-homework/submissions?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.studentsWithSubmissions || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedHomeworkId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Homework</h3>
        <p className="text-gray-600 mb-4">
          Choose a homework assignment from the list to track student submissions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📋</div>
        <div className="text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Tracking</h3>
        <p className="text-gray-600 mb-4">
          Advanced submission tracking interface is being developed.
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
          💡 <strong>Coming Features:</strong> Student submission grid, individual feedback, bulk grading, and file preview.
        </div>
      </div>
    </div>
  );
};

export default TeacherHomeworkSubmissions;
