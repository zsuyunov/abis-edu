"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Users, TrendingUp, Clock } from "lucide-react";

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface AttendanceStats {
  totalStudents: number;
  presentRate: number;
  absentRate: number;
  lateRate: number;
  excusedRate: number;
  weeklyData: AttendanceData[];
  monthlyTrend: {
    month: string;
    attendance: number;
  }[];
}

const AttendanceChartContainer = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchAttendanceData();
  }, [timeRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/attendance-analytics?range=${timeRange}`);
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      } else {
        // No data available
        setAttendanceData(null);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      // No data available
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[450px]">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-[450px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Attendance Overview</h3>
            <p className="text-sm text-gray-600">Daily attendance tracking</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {attendanceData ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Present</span>
            </div>
            <div className="text-xl font-bold text-blue-800 mt-1">
              {attendanceData.presentRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Absent</span>
            </div>
            <div className="text-xl font-bold text-red-800 mt-1">
              {attendanceData.absentRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Late</span>
            </div>
            <div className="text-xl font-bold text-yellow-800 mt-1">
              {attendanceData.lateRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Excused</span>
            </div>
            <div className="text-xl font-bold text-green-800 mt-1">
              {attendanceData.excusedRate.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No attendance data available</p>
          <p className="text-sm text-gray-400 mt-1">Please ensure the attendance analytics API is configured</p>
        </div>
      )}

      {/* Charts */}
      {attendanceData && attendanceData.weeklyData && attendanceData.weeklyData.length > 0 ? (
        <div className="h-64">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Attendance</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceData.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="present" fill="#3B82F6" radius={[2, 2, 0, 0]} name="Present" />
              <Bar dataKey="late" fill="#F59E0B" radius={[2, 2, 0, 0]} name="Late" />
              <Bar dataKey="absent" fill="#EF4444" radius={[2, 2, 0, 0]} name="Absent" />
              <Bar dataKey="excused" fill="#10B981" radius={[2, 2, 0, 0]} name="Excused" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
};

export default AttendanceChartContainer;
