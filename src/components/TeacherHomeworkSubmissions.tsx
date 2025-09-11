"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');

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

      const response = await fetch(`/api/teacher-homework/submissions?${queryParams}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissionData(data);
        onDataUpdate(data);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "GRADED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "MISSING":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "✅";
      case "GRADED":
        return "📝";
      case "LATE":
        return "⏰";
      case "MISSING":
        return "❌";
      default:
        return "📋";
    }
  };

  if (!submissionData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Unable to load submission data.</p>
        </div>
      </div>
    );
  }

  const { homework, studentsWithSubmissions, stats } = submissionData;
  const students = studentsWithSubmissions || [];

  return (
    <div className="space-y-6">
      {/* Header with homework info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{homework.title}</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Image src="/subject.png" alt="Subject" width={16} height={16} />
                  <span>{homework.subject.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/class.png" alt="Class" width={16} height={16} />
                  <span>{homework.class.name}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Image src="/date.png" alt="Assigned" width={16} height={16} />
                  <span>Assigned: {new Date(homework.assignedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image src="/calendar.png" alt="Due" width={16} height={16} />
                  <span>Due: {new Date(homework.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <div className="text-xs text-gray-600">Total Students</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.submittedCount}</div>
              <div className="text-xs text-gray-600">Submitted</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
              <div className="text-xs text-gray-600">Late</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{stats.gradedCount}</div>
              <div className="text-xs text-gray-600">Graded</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{stats.submissionRate}%</div>
              <div className="text-xs text-gray-600">Submission Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Student Submissions</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedView('grid')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedView === 'grid'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedView === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Students Grid/List */}
      {selectedView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map((student: any) => (
            <div
              key={student.student.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {student.student.firstName.charAt(0)}{student.student.lastName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {student.student.firstName} {student.student.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{student.student.studentId}</p>
                </div>
              </div>
              
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.submission.status)}`}>
                {getStatusIcon(student.submission.status)} {student.submission.status}
              </div>
              
              {student.submission.status !== 'MISSING' && (
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  {student.submission.submittedAt && (
                    <div>Submitted: {new Date(student.submission.submittedAt).toLocaleDateString()}</div>
                  )}
                  {student.submission.grade && (
                    <div className="font-medium text-green-600">Grade: {student.submission.grade}</div>
                  )}
                  {student.submission.isLate && (
                    <div className="text-yellow-600">⏰ Late submission</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student: any) => (
                  <tr key={student.student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {student.student.firstName.charAt(0)}{student.student.lastName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {student.student.firstName} {student.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{student.student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.submission.status)}`}>
                        {getStatusIcon(student.submission.status)} {student.submission.status}
                      </span>
                      {student.submission.isLate && (
                        <div className="text-xs text-yellow-600 mt-1">⏰ Late</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.submission.submittedAt
                        ? new Date(student.submission.submittedAt).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.submission.grade ? (
                        <span className="font-medium text-green-600">{student.submission.grade}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {student.submission.status !== 'MISSING' ? (
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-900 transition-colors">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-900 transition-colors">
                            Grade
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">No submission</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {students.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-600">No students are enrolled in this class or no submissions available.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherHomeworkSubmissions;
