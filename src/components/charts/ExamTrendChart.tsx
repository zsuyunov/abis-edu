"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExamTrendChartProps {
  data: Array<{
    examName: string;
    date: string;
    averageScore: number;
    passPercentage: number;
  }>;
}

const ExamTrendChart = ({ data }: ExamTrendChartProps) => {
  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.examName.length > 15 ? item.examName.substring(0, 15) + '...' : item.examName,
    fullName: item.examName,
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    averageScore: item.averageScore,
    passPercentage: item.passPercentage
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.fullName}</p>
          <p className="text-sm text-gray-600">
            Average Score: {data.payload.averageScore}%
          </p>
          <p className="text-sm text-gray-600">
            Pass Rate: {data.payload.passPercentage}%
          </p>
          <p className="text-sm text-gray-500">
            Date: {data.payload.date}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Exam Performance Trends
      </h3>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Pass Rate (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="averageScore"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Average Score (%)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="passPercentage"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              name="Pass Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Track exam performance and pass rates over time
      </div>
    </div>
  );
};

export default ExamTrendChart;