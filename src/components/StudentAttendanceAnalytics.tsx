"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  percentage: number;
}

interface StudentAttendanceAnalyticsProps {
  studentId: string;
}

const StudentAttendanceAnalytics = ({ studentId }: StudentAttendanceAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"7days" | "4weeks" | "12weeks" | "year">("7days");
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
    percentage: 0
  });
  const [barData, setBarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStats();
  }, [selectedPeriod, studentId]);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-attendance?studentId=${studentId}&period=${selectedPeriod}`, {
        headers: {
          'x-user-id': studentId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          percentage: 0
        });
        setBarData(data.barData || []);
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Present", value: stats.present, color: "#10B981" },
    { name: "Late", value: stats.late, color: "#F59E0B" },
    { name: "Absent", value: stats.absent, color: "#EF4444" },
    { name: "Excused", value: stats.excused, color: "#8B5CF6" }
  ].filter(item => item.value > 0);

  const periodLabels = {
    "7days": "7 DAYS",
    "4weeks": "4 WEEKS", 
    "12weeks": "12 WEEKS",
    "year": "YEAR"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-gray-100 rounded-full p-1 flex">
        {(["7days", "4weeks", "12weeks", "year"] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              selectedPeriod === period
                ? "bg-green-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Left Side - 3 Stats */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                <p className="text-sm text-gray-600">On Time</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                <p className="text-sm text-gray-600">Lates</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                <p className="text-sm text-gray-600">Absences</p>
              </div>
            </div>
          </div>

          {/* Right Side - 2 Stats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.5-1.5a11 11 0 01-4.5 9" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.excused}</p>
                <p className="text-sm text-gray-600">Excused</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}h</p>
                <p className="text-sm text-gray-600">Attended</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Rounded Chart Below */}
        <div className="flex justify-center">
          <div className="relative w-64 h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    cornerRadius={8}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full rounded-full border-8 border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-400">0%</div>
                  <div className="text-sm text-gray-500">No Data</div>
                </div>
              </div>
            )}
            
            {/* Center Text with Modern Design */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {Math.round(stats.percentage)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">Attendance</div>
                <div className="text-xs text-gray-500">Tap to view</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Trends</h3>
          <p className="text-sm text-gray-600">Weekly attendance percentage over time</p>
        </div>
        <div className="h-72">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h4>
                <p className="text-gray-500">Attendance trends will appear here once you have more data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceAnalytics;
