"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
}

const AttendanceChart = ({ data }: AttendanceChartProps) => {
  // Transform data for better display
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    present: item.present,
    absent: item.absent,
    late: item.late,
    excused: item.excused,
    presentPercentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
    absentPercentage: item.total > 0 ? Math.round((item.absent / item.total) * 100) : 0,
    latePercentage: item.total > 0 ? Math.round((item.late / item.total) * 100) : 0,
    excusedPercentage: item.total > 0 ? Math.round((item.excused / item.total) * 100) : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-green-600">Present:</span>
              <span>{data.present} ({data.presentPercentage}%)</span>
            </p>
            <p className="flex justify-between">
              <span className="text-red-600">Absent:</span>
              <span>{data.absent} ({data.absentPercentage}%)</span>
            </p>
            <p className="flex justify-between">
              <span className="text-yellow-600">Late:</span>
              <span>{data.late} ({data.latePercentage}%)</span>
            </p>
            <p className="flex justify-between">
              <span className="text-blue-600">Excused:</span>
              <span>{data.excused} ({data.excusedPercentage}%)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate overall statistics
  const totalRecords = chartData.length;
  const avgPresent = totalRecords > 0
    ? Math.round(chartData.reduce((sum, item) => sum + item.presentPercentage, 0) / totalRecords)
    : 0;
  const avgAbsent = totalRecords > 0
    ? Math.round(chartData.reduce((sum, item) => sum + item.absentPercentage, 0) / totalRecords)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Attendance Trends
        </h3>
        <div className="text-right text-sm">
          <div className="text-green-600 font-medium">
            Avg Present: {avgPresent}%
          </div>
          <div className="text-red-600 font-medium">
            Avg Absent: {avgAbsent}%
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'Students', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="present"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              name="Present"
            />
            <Area
              type="monotone"
              dataKey="late"
              stackId="1"
              stroke="#F59E0B"
              fill="#F59E0B"
              name="Late"
            />
            <Area
              type="monotone"
              dataKey="excused"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              name="Excused"
            />
            <Area
              type="monotone"
              dataKey="absent"
              stackId="1"
              stroke="#EF4444"
              fill="#EF4444"
              name="Absent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Excused</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Absent</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;
