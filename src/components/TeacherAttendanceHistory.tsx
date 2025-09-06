"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherAttendanceHistoryProps {
  teacherId: string;
  filters: any;
  onTeacherDataUpdate: (data: any) => void;
}

const TeacherAttendanceHistory = ({
  teacherId,
  filters,
  onTeacherDataUpdate,
}: TeacherAttendanceHistoryProps) => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>({});
  const [editingAttendance, setEditingAttendance] = useState<any>(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [teacherId, filters]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        view: "history",
        ...filters,
      });

      const response = await fetch(`/api/teacher-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAttendances(data.attendances || []);
        setSummary(data.summary || {});
        onTeacherDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (attendance: any) => {
    const today = new Date();
    const attendanceDate = new Date(attendance.date);
    const isToday = attendanceDate.toDateString() === today.toDateString();
    
    if (isToday) {
      setEditingAttendance(attendance);
    } else {
      alert("You can only edit today's attendance records. Historical records are locked.");
    }
  };

  const handleSaveEdit = async (updatedAttendance: any) => {
    try {
      const response = await fetch("/api/teacher-attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAttendance),
      });

      if (response.ok) {
        setEditingAttendance(null);
        fetchAttendanceHistory(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error updating attendance: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "EXCUSED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "✅";
      case "ABSENT":
        return "❌";
      case "LATE":
        return "⏱";
      case "EXCUSED":
        return "📝";
      default:
        return "❓";
    }
  };

  const canEdit = (attendance: any) => {
    const today = new Date();
    const attendanceDate = new Date(attendance.date);
    return attendanceDate.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <div className="text-gray-600">Loading attendance history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY STATS */}
      {summary.totalRecords > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.presentCount}</div>
            <div className="text-sm text-green-700">Present</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.absentCount}</div>
            <div className="text-sm text-red-700">Absent</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.lateCount}</div>
            <div className="text-sm text-yellow-700">Late</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.attendanceRate}%</div>
            <div className="text-sm text-blue-700">Attendance Rate</div>
          </div>
        </div>
      )}

      {/* ATTENDANCE RECORDS */}
      {attendances.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h3>
          <p className="text-gray-600">
            No attendance records found for the selected filters. Try adjusting your date range or class selection.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Attendance History</h3>
            <p className="text-sm text-gray-600 mt-1">
              {attendances.length} records found. You can edit today's records only.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendances.map((attendance: any) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {new Date(attendance.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Image src="/student.png" alt="Student" width={16} height={16} className="invert" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.student.firstName} {attendance.student.lastName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {attendance.student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {attendance.class.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {attendance.subject.name}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
                        {getStatusIcon(attendance.status)} {attendance.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {attendance.notes || "-"}
                    </td>
                    <td className="px-4 py-4">
                      {canEdit(attendance) ? (
                        <button
                          onClick={() => handleEdit(attendance)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL (placeholder for now) */}
      {editingAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Attendance</h3>
            <p className="text-sm text-gray-600 mb-4">
              Editing attendance for {editingAttendance.student.firstName} {editingAttendance.student.lastName}
            </p>
            
            {/* Status options */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex gap-2">
                {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setEditingAttendance({...editingAttendance, status})}
                    className={`px-3 py-1 rounded text-sm font-medium border ${
                      editingAttendance.status === status
                        ? getStatusColor(status) + " border-current"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {getStatusIcon(status)} {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={editingAttendance.notes || ""}
                onChange={(e) => setEditingAttendance({...editingAttendance, notes: e.target.value})}
                placeholder="Add notes..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveEdit(editingAttendance)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingAttendance(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceHistory;
