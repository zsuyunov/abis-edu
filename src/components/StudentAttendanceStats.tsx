"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StudentAttendanceStatsProps {
  studentId: string;
}

const StudentAttendanceStats = ({ studentId }: StudentAttendanceStatsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const periods = [
    { key: "7days", label: "7 DAYS" },
    { key: "4weeks", label: "4 WEEKS" },
    { key: "12weeks", label: "12 WEEKS" },
    { key: "year", label: "YEAR" },
  ];

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedPeriod, studentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-attendance?period=${selectedPeriod}&view=stats`, {
        headers: {
          'x-user-id': studentId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getCircleColor = (rate: number) => {
    if (rate >= 90) return "#10B981"; // green-500
    if (rate >= 75) return "#F59E0B"; // yellow-500
    return "#EF4444"; // red-500
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = attendanceData?.stats || {};
  const attendanceRate = stats.attendanceRate || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Period Selector */}
      <div className="bg-gray-50 p-4">
        <div className="flex bg-white rounded-full p-1 shadow-sm">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                selectedPeriod === period.key
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.presentCount || 0}</div>
                <div className="text-sm text-gray-600">On Time</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.lateCount || 0}</div>
                <div className="text-sm text-gray-600">Lates</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.absentCount || 0}</div>
                <div className="text-sm text-gray-600">Absences</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalRecords || 0}h</div>
                <div className="text-sm text-gray-600">Attended</div>
              </div>
            </div>
          </div>

          {/* Right Side - Circular Progress */}
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getCircleColor(attendanceRate)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(attendanceRate / 100) * 314} 314`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${getAttendanceColor(attendanceRate)}`}>
                {attendanceRate}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Attendance</div>
              <div className="text-xs text-gray-500">Tap to view</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-end h-32">
            {stats.chartData && stats.chartData.length > 0 ? (
              stats.chartData.slice(-7).map((day: any, index: number) => {
                const totalLessons = day.total || 1;
                const attendedLessons = day.present + day.excused;
                const attendancePercent = (attendedLessons / totalLessons) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="w-6 bg-gray-200 rounded-full overflow-hidden" style={{ height: '80px' }}>
                      <div
                        className="w-full bg-green-400 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          height: `${attendancePercent}%`,
                          marginTop: `${100 - attendancePercent}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {selectedPeriod === "7days" 
                        ? new Date(day.date).toLocaleDateString('en', { weekday: 'short' })
                        : selectedPeriod === "4weeks"
                        ? new Date(day.date).toLocaleDateString('en', { day: '2-digit', month: '2-digit' })
                        : selectedPeriod === "12weeks"
                        ? `W${Math.ceil(index / 7) + 26}`
                        : new Date(day.date).toLocaleDateString('en', { month: 'short' })
                      }
                    </div>
                  </div>
                );
              })
            ) : (
              // Empty state with sample bars
              Array.from({ length: selectedPeriod === "7days" ? 7 : selectedPeriod === "4weeks" ? 4 : selectedPeriod === "12weeks" ? 12 : 12 }, (_, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-gray-200 rounded-full" style={{ height: '80px' }}>
                    <div className="w-full bg-green-400 rounded-full" style={{ height: '0%' }}></div>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {selectedPeriod === "7days" 
                      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]
                      : selectedPeriod === "4weeks"
                      ? `${17 + index}/08`
                      : selectedPeriod === "12weeks"
                      ? `${26 + index}`
                      : `${11 + index}`
                    }
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-2 top-4 flex flex-col justify-between h-20 text-xs text-gray-500">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceStats;
