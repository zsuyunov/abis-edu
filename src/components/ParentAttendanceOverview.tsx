"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ParentAttendanceOverviewProps {
  parentId: string;
  selectedChild: any;
  filters: any;
  timeFilter: string;
  attendanceData: any;
  view?: string;
  onDataUpdate: (data: any) => void;
}

const ParentAttendanceOverview = ({
  parentId,
  selectedChild,
  filters,
  timeFilter,
  attendanceData,
  view = "overview",
  onDataUpdate,
}: ParentAttendanceOverviewProps) => {
  const [loading, setLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChild) {
      fetchAttendanceData();
    }
  }, [selectedChild.id, filters, timeFilter]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        childId: selectedChild.id,
        timeFilter,
        view: "overview",
        ...filters,
      });

      const response = await fetch(`/api/parent-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        onDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel', reportType: 'detailed' | 'summary' = 'detailed') => {
    try {
      setExportLoading(format);
      
      const queryParams = new URLSearchParams({
        parentId,
        childId: selectedChild.id,
        format,
        reportType,
        timeFilter,
        includeClassAverage: filters.includeClassAverage.toString(),
        ...filters,
      });

      const response = await fetch(`/api/parent-attendance/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedChild.firstName}_attendance_${reportType}_${format === 'pdf' ? 'report.html' : 'report.csv'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(null);
      setShowExportOptions(false);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📊</div>
        <div className="text-gray-600">Loading {selectedChild.firstName}'s attendance data...</div>
      </div>
    );
  }

  const { attendances = [], summary = {}, subjectStats = [], classComparison } = attendanceData;

  return (
    <div className="space-y-6">
      {/* SUMMARY STATISTICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.totalRecords || 0}</div>
          <div className="text-sm text-gray-600">Total Classes</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.presentCount || 0}</div>
          <div className="text-sm text-green-700">Present</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{summary.absentCount || 0}</div>
          <div className="text-sm text-red-700">Absent</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.lateCount || 0}</div>
          <div className="text-sm text-yellow-700">Late</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.attendanceRate || 0}%</div>
          <div className="text-sm text-blue-700">Attendance Rate</div>
        </div>
      </div>

      {/* CLASS COMPARISON */}
      {classComparison && filters.includeClassAverage && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
          <h3 className="font-semibold text-cyan-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            Class Performance Comparison
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-cyan-200">
              <div className="text-2xl font-bold text-blue-600">{summary.attendanceRate || 0}%</div>
              <div className="text-sm text-blue-700">{selectedChild.firstName}'s Rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-cyan-200">
              <div className="text-2xl font-bold text-purple-600">{classComparison.classAverage?.attendanceRate || 0}%</div>
              <div className="text-sm text-purple-700">Class Average</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-cyan-200">
              <div className={`text-2xl font-bold ${
                (summary.attendanceRate || 0) > (classComparison.classAverage?.attendanceRate || 0) ? 'text-green-600' :
                (summary.attendanceRate || 0) < (classComparison.classAverage?.attendanceRate || 0) ? 'text-red-600' : 'text-gray-600'
              }`}>
                {(summary.attendanceRate || 0) - (classComparison.classAverage?.attendanceRate || 0) > 0 ? '+' : ''}
                {(summary.attendanceRate || 0) - (classComparison.classAverage?.attendanceRate || 0)}%
              </div>
              <div className="text-sm text-gray-700">Difference</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-cyan-800">
              {(summary.attendanceRate || 0) > (classComparison.classAverage?.attendanceRate || 0) ? 
                `🎉 ${selectedChild.firstName} is performing above the class average!` :
                (summary.attendanceRate || 0) < (classComparison.classAverage?.attendanceRate || 0) ?
                `📈 There's room for improvement to reach the class average.` :
                `✅ ${selectedChild.firstName} is performing at the class average.`}
            </p>
            <p className="text-xs text-cyan-600 mt-1">
              Based on {classComparison.studentsInClass} students in {selectedChild.class.name}
            </p>
          </div>
        </div>
      )}

      {/* SUBJECT-WISE BREAKDOWN */}
      {subjectStats.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">📚 Subject-wise Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedChild.firstName}'s attendance rate across different subjects
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {subjectStats.map((subject: any) => (
                <div key={subject.subject.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Image src="/subject.png" alt="Subject" width={20} height={20} className="invert" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{subject.subject.name}</div>
                      <div className="text-sm text-gray-600">
                        {subject.totalRecords} classes | {subject.presentCount} present, {subject.absentCount} absent
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      subject.attendanceRate >= 95 ? 'text-green-600' :
                      subject.attendanceRate >= 85 ? 'text-blue-600' :
                      subject.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {subject.attendanceRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {subject.attendanceRate >= 95 ? 'Excellent' :
                       subject.attendanceRate >= 85 ? 'Good' :
                       subject.attendanceRate >= 75 ? 'Fair' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPORT SECTION */}
      {view === "export" && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">📁 Export {selectedChild.firstName}'s Attendance Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate detailed reports for parent-teacher meetings or personal tracking
            </p>
          </div>
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* PDF Export */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">PDF</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">PDF Report</div>
                    <div className="text-sm text-gray-600">Professional formatted report for meetings</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport('pdf', 'detailed')}
                    disabled={exportLoading === 'pdf'}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 text-sm"
                  >
                    {exportLoading === 'pdf' ? 'Generating...' : 'Download Detailed PDF'}
                  </button>
                  <button
                    onClick={() => handleExport('pdf', 'summary')}
                    disabled={exportLoading === 'pdf'}
                    className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 disabled:opacity-50 text-sm"
                  >
                    {exportLoading === 'pdf' ? 'Generating...' : 'Download Summary PDF'}
                  </button>
                </div>
              </div>

              {/* Excel Export */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">XLS</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Excel Report</div>
                    <div className="text-sm text-gray-600">Spreadsheet for detailed analysis</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport('excel', 'detailed')}
                    disabled={exportLoading === 'excel'}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    {exportLoading === 'excel' ? 'Generating...' : 'Download Detailed Excel'}
                  </button>
                  <button
                    onClick={() => handleExport('excel', 'summary')}
                    disabled={exportLoading === 'excel'}
                    className="w-full px-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-50 disabled:opacity-50 text-sm"
                  >
                    {exportLoading === 'excel' ? 'Generating...' : 'Download Summary Excel'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>💡 Export Features:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• <strong>Class Comparison:</strong> {filters.includeClassAverage ? 'Included' : 'Not included'} (toggle in filters)</li>
                  <li>• <strong>Detailed reports</strong> include all attendance records with teacher notes</li>
                  <li>• <strong>Summary reports</strong> focus on statistics and insights</li>
                  <li>• Use filters above to export specific date ranges or subjects</li>
                  <li>• Perfect for parent-teacher conferences and school meetings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED RECORDS */}
      {view === "records" && attendances.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">📋 {selectedChild.firstName}'s Detailed Attendance Records</h3>
            <p className="text-sm text-gray-600 mt-1">
              {attendances.length} records found. Complete attendance history in chronological order.
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
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendances.map((attendance: any) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {new Date(attendance.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Image src="/subject.png" alt="Subject" width={16} height={16} className="invert" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {attendance.subject.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {attendance.teacher.firstName} {attendance.teacher.lastName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(attendance.timetable.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })} - {new Date(attendance.timetable.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
                        {getStatusIcon(attendance.status)} {attendance.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {attendance.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PARENT INSIGHTS */}
      {attendanceData.parentInsights && attendanceData.parentInsights.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <span>💡</span>
            Attendance Insights for {selectedChild.firstName}
          </h3>
          
          <div className="space-y-3">
            {attendanceData.parentInsights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-md">
                <div className="text-green-600 mt-0.5">
                  {insight.includes("Excellent") || insight.includes("outstanding") ? "🌟" :
                   insight.includes("Good") || insight.includes("above average") ? "👍" :
                   insight.includes("Perfect punctuality") ? "⏰" :
                   insight.includes("improvement") || insight.includes("perfect attendance") ? "📈" :
                   insight.includes("concern") || insight.includes("needs improvement") ? "⚠️" :
                   insight.includes("Critical") || insight.includes("contact") ? "🚨" : "💡"}
                </div>
                <div className="text-sm text-green-800">
                  {insight}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NO DATA STATE */}
      {attendances.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h3>
          <p className="text-gray-600 mb-4">
            No attendance records found for {selectedChild.firstName} with the selected filters.
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
            💡 <strong>Tip:</strong> Try adjusting your filters or check if classes have started for the selected academic year.
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAttendanceOverview;
