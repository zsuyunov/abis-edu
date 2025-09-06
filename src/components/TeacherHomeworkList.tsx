"use client";

import { useState } from "react";
import Image from "next/image";

interface TeacherHomeworkListProps {
  teacherId: string;
  homeworkData: any;
  loading: boolean;
  onHomeworkSelect: (homeworkId: number) => void;
  onDataUpdate: (data: any) => void;
}

const TeacherHomeworkList = ({
  teacherId,
  homeworkData,
  loading,
  onHomeworkSelect,
  onDataUpdate,
}: TeacherHomeworkListProps) => {
  const [selectedHomework, setSelectedHomework] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📚</div>
        <div className="text-gray-600">Loading homework assignments...</div>
      </div>
    );
  }

  const homework = homeworkData.homework || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "✅";
      case "EXPIRED":
        return "⏰";
      case "ARCHIVED":
        return "📦";
      default:
        return "📚";
    }
  };

  if (homework.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Homework Assignments</h3>
        <p className="text-gray-600 mb-4">
          You haven't created any homework assignments yet. Start by creating your first homework.
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
          💡 <strong>Tip:</strong> Use the "Create Homework" tab to design engaging assignments with multimedia content.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {homework.map((hw: any) => (
        <div
          key={hw.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hw.status)}`}>
                  {getStatusIcon(hw.status)} {hw.status}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/subject.png" alt="Subject" width={16} height={16} />
                    <span>{hw.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/class.png" alt="Class" width={16} height={16} />
                    <span>{hw.class.name}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/date.png" alt="Assigned" width={16} height={16} />
                    <span>Assigned: {new Date(hw.assignedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Image src="/calendar.png" alt="Due" width={16} height={16} />
                    <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {hw.description && (
                <p className="mt-3 text-sm text-gray-600">{hw.description}</p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{hw.stats.totalStudents}</div>
                <div className="text-xs text-gray-600">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{hw.stats.submittedCount}</div>
                <div className="text-xs text-gray-600">Submitted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{hw.stats.lateCount}</div>
                <div className="text-xs text-gray-600">Late</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{hw.stats.gradedCount}</div>
                <div className="text-xs text-gray-600">Graded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{hw.stats.submissionRate}%</div>
                <div className="text-xs text-gray-600">Submission Rate</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hw.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                  📎 {hw.attachments.length} attachment{hw.attachments.length !== 1 ? 's' : ''}
                </span>
              )}
              {hw.totalPoints && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                  🎯 {hw.totalPoints} points
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onHomeworkSelect(hw.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Track Submissions
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
                Edit
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeacherHomeworkList;
