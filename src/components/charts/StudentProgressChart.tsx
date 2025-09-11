"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StudentProgressChartProps {
  data: Array<{
    date: Date;
    value: number;
    type: string;
  }>;
  studentName: string;
}

const StudentProgressChart = ({ data, studentName }: StudentProgressChartProps) => {
  // Transform data for chart
  const chartData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      score: item.value,
      type: item.type,
      fullDate: item.date
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Score: {data.value}%
          </p>
          <p className="text-sm text-gray-500">
            Type: {data.payload.type}
          </p>
        </div>
      );
    }
    return null;
  };

  const averageScore = chartData.length > 0
    ? Math.round(chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length)
    : 0;

  const trend = chartData.length > 1
    ? chartData[chartData.length - 1].score - chartData[0].score
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Progress Chart - {studentName}
        </h3>
        <div className="text-right text-sm">
          <div className="font-medium text-gray-900">Avg: {averageScore}%</div>
          <div className={`font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Trend: {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
              name="Grade Score (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Track performance trends over time
      </div>
    </div>
  );
};

export default StudentProgressChart;