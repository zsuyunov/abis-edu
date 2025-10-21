"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { Calendar, Users, TrendingUp, Clock, School } from "lucide-react";

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

const COLORS = {
  present: '#10B981',
  late: '#F59E0B', 
  absent: '#EF4444',
  excused: '#8B5CF6'
};

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
        setAttendanceData(null);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const getPieData = () => {
    if (!attendanceData) return [];
    return [
      { name: 'Present', value: attendanceData.presentRate, color: COLORS.present },
      { name: 'Late', value: attendanceData.lateRate, color: COLORS.late },
      { name: 'Absent', value: attendanceData.absentRate, color: COLORS.absent },
      { name: 'Excused', value: attendanceData.excusedRate, color: COLORS.excused },
    ].filter(item => item.value > 0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-lg border border-gray-200 p-8 h-[600px]">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3"></div>
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/4"></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
            ))}
          </div>
          <div className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-lg border border-gray-200 p-8 min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Attendance Overview</h3>
            <p className="text-sm text-gray-600 mt-1">
              {attendanceData ? `Tracking ${attendanceData.totalStudents} students across all branches` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-white rounded-xl p-1.5 shadow-md border border-gray-200">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {attendanceData ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-5 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-green-500 rounded-lg shadow-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                  Active
                </div>
            </div>
              <div className="text-3xl font-bold text-green-900 mb-1">
              {attendanceData.presentRate.toFixed(1)}%
            </div>
              <span className="text-sm font-medium text-green-700">Present Students</span>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-5 border-2 border-red-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-red-500 rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded-full">
                  Alert
                </div>
              </div>
              <div className="text-3xl font-bold text-red-900 mb-1">
              {attendanceData.absentRate.toFixed(1)}%
              </div>
              <span className="text-sm font-medium text-red-700">Absent Students</span>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-5 border-2 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-yellow-500 rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                  Warning
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-900 mb-1">
                {attendanceData.lateRate.toFixed(1)}%
          </div>
              <span className="text-sm font-medium text-yellow-700">Late Arrivals</span>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-5 border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-purple-500 rounded-lg shadow-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                  Excused
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {attendanceData.excusedRate.toFixed(1)}%
              </div>
              <span className="text-sm font-medium text-purple-700">Excused Absences</span>
            </div>
          </div>

          {/* Charts Section */}
          {attendanceData.weeklyData && attendanceData.weeklyData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Bar Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  {timeRange === 'week' ? 'Daily' : timeRange === 'month' ? 'Weekly' : 'Monthly'} Attendance Breakdown
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={attendanceData.weeklyData} barGap={2}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="colorExcused" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      stroke="#9ca3af"
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Bar 
                      dataKey="present" 
                      fill="url(#colorPresent)" 
                      radius={[6, 6, 0, 0]} 
                      name="Present"
                    />
                    <Bar 
                      dataKey="late" 
                      fill="url(#colorLate)" 
                      radius={[6, 6, 0, 0]} 
                      name="Late"
                    />
                    <Bar 
                      dataKey="absent" 
                      fill="url(#colorAbsent)" 
                      radius={[6, 6, 0, 0]} 
                      name="Absent"
                    />
                    <Bar 
                      dataKey="excused" 
                      fill="url(#colorExcused)" 
                      radius={[6, 6, 0, 0]} 
                      name="Excused"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                  Distribution
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {getPieData().map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 shadow-md border border-gray-200 text-center">
              <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-500 font-medium">No attendance records found</p>
              <p className="text-sm text-gray-400 mt-2">Data will appear here once attendance is recorded</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-md border border-gray-200 text-center">
          <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500 font-medium">No attendance data available</p>
          <p className="text-sm text-gray-400 mt-2">Please ensure the attendance analytics API is configured</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceChartContainer;
