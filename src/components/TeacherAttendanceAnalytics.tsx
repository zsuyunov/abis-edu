"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherAttendanceAnalyticsProps {
  teacherId: string;
  filters: any;
  onTeacherDataUpdate: (data: any) => void;
}

const TeacherAttendanceAnalytics = ({
  teacherId,
  filters,
  onTeacherDataUpdate,
}: TeacherAttendanceAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceAnalytics();
  }, [teacherId, filters]);

  const fetchAttendanceAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        view: "analytics",
        ...filters,
      });

      const response = await fetch(`/api/teacher-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || {});
        onTeacherDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching attendance analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📊</div>
        <div className="text-gray-600">Loading attendance analytics...</div>
      </div>
    );
  }

  const summary = analytics.summary || {};
  const byStudent = analytics.byStudent || [];
  const byClass = analytics.byClass || [];
  const bySubject = analytics.bySubject || [];
  const frequentAbsentees = analytics.frequentAbsentees || [];
  const perfectAttendance = analytics.perfectAttendance || [];

  return (
    <div className="space-y-6">
      {/* OVERALL SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.totalRecords || 0}</div>
          <div className="text-sm text-gray-600">Total Records</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.attendanceRate || 0}%</div>
          <div className="text-sm text-green-700">Attendance Rate</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{summary.absenteeismRate || 0}%</div>
          <div className="text-sm text-red-700">Absenteeism Rate</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.lateCount || 0}</div>
          <div className="text-sm text-yellow-700">Late Arrivals</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{summary.excusedCount || 0}</div>
          <div className="text-sm text-purple-700">Excused Absences</div>
        </div>
      </div>

      {/* ANALYTICS SECTIONS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* FREQUENT ABSENTEES */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>⚠️</span>
              Students Needing Attention
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Students with frequent absences or low attendance rates
            </p>
          </div>
          <div className="p-4">
            {frequentAbsentees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-sm text-green-600 font-medium">Great!</div>
                <div className="text-xs text-gray-600">No students with attendance concerns</div>
              </div>
            ) : (
              <div className="space-y-3">
                {frequentAbsentees.slice(0, 5).map((student: any, index: number) => (
                  <div key={student.student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <Image src="/student.png" alt="Student" width={16} height={16} className="invert" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.student.firstName} {student.student.lastName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {student.absentCount} absences
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        {student.attendanceRate}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {student.totalRecords} records
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PERFECT ATTENDANCE */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>🏆</span>
              Perfect Attendance
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Students with excellent attendance records
            </p>
          </div>
          <div className="p-4">
            {perfectAttendance.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-sm text-gray-600">No perfect attendance records yet</div>
                <div className="text-xs text-gray-500">Students need at least 10 records</div>
              </div>
            ) : (
              <div className="space-y-3">
                {perfectAttendance.slice(0, 5).map((student: any, index: number) => (
                  <div key={student.student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Image src="/student.png" alt="Student" width={16} height={16} className="invert" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.student.firstName} {student.student.lastName}
                        </div>
                        <div className="text-xs text-green-600">
                          Perfect attendance
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">
                        100%
                      </div>
                      <div className="text-xs text-gray-600">
                        {student.totalRecords} records
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CLASS PERFORMANCE */}
      {byClass.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Class Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Attendance rates by class
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {byClass.map((classData: any) => (
                <div key={classData.class.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{classData.class.name}</div>
                    <div className="text-sm text-gray-600">
                      {classData.totalRecords} total records
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {classData.attendanceRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {classData.presentCount} present, {classData.absentCount} absent
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBJECT PERFORMANCE */}
      {bySubject.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Subject Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Attendance rates by subject
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {bySubject.map((subjectData: any) => (
                <div key={subjectData.subject.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{subjectData.subject.name}</div>
                    <div className="text-sm text-gray-600">
                      {subjectData.totalRecords} total records
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {subjectData.attendanceRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {subjectData.presentCount} present, {subjectData.absentCount} absent
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INSIGHTS AND RECOMMENDATIONS */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span>💡</span>
          Insights & Recommendations
        </h4>
        <div className="space-y-3">
          {summary.attendanceRate >= 90 && (
            <div className="flex items-start gap-3 text-green-800">
              <span className="text-lg">🎉</span>
              <div>
                <div className="font-medium">Excellent Attendance Rate!</div>
                <div className="text-sm">Your classes maintain a {summary.attendanceRate}% attendance rate, which is outstanding.</div>
              </div>
            </div>
          )}
          
          {summary.attendanceRate < 80 && (
            <div className="flex items-start gap-3 text-red-800">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-medium">Attendance Needs Attention</div>
                <div className="text-sm">With {summary.attendanceRate}% attendance, consider implementing strategies to improve student engagement.</div>
              </div>
            </div>
          )}

          {frequentAbsentees.length > 0 && (
            <div className="flex items-start gap-3 text-orange-800">
              <span className="text-lg">👥</span>
              <div>
                <div className="font-medium">Students Need Support</div>
                <div className="text-sm">{frequentAbsentees.length} students have attendance concerns. Consider reaching out to understand barriers.</div>
              </div>
            </div>
          )}

          {summary.lateCount > 0 && (
            <div className="flex items-start gap-3 text-yellow-800">
              <span className="text-lg">⏰</span>
              <div>
                <div className="font-medium">Tardiness Tracking</div>
                <div className="text-sm">{summary.lateCount} late arrivals recorded. Consider discussing punctuality expectations with students.</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 text-blue-800">
            <span className="text-lg">📊</span>
            <div>
              <div className="font-medium">Data-Driven Decisions</div>
              <div className="text-sm">Use the export feature to generate detailed reports for parent conferences and administrative meetings.</div>
            </div>
          </div>
        </div>
      </div>

      {/* NO DATA STATE */}
      {summary.totalRecords === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">
            No attendance data found for the selected filters. Start taking attendance to see analytics.
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
            💡 <strong>Tip:</strong> Take attendance for a few classes to generate meaningful analytics and insights.
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendanceAnalytics;
