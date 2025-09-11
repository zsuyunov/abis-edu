"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ClassAverageChartProps {
  data: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    termly?: number;
    yearly?: number;
    examMidterm?: number;
    examFinal?: number;
    examNational?: number;
  };
  classAverage: number;
}

const ClassAverageChart = ({ data, classAverage }: ClassAverageChartProps) => {
  const chartData = [
    {
      name: 'Daily',
      value: data.daily || 0,
      type: 'Assessment'
    },
    {
      name: 'Weekly',
      value: data.weekly || 0,
      type: 'Assessment'
    },
    {
      name: 'Monthly',
      value: data.monthly || 0,
      type: 'Assessment'
    },
    {
      name: 'Termly',
      value: data.termly || 0,
      type: 'Assessment'
    },
    {
      name: 'Yearly',
      value: data.yearly || 0,
      type: 'Assessment'
    },
    {
      name: 'Midterm',
      value: data.examMidterm || 0,
      type: 'Exam'
    },
    {
      name: 'Final',
      value: data.examFinal || 0,
      type: 'Exam'
    },
    {
      name: 'National',
      value: data.examNational || 0,
      type: 'Exam'
    }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Average: {payload[0].value}%
          </p>
          <p className="text-sm text-gray-500">
            Type: {payload[0].payload.type}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Class Average by Grade Type
      </h3>

      <div className="mb-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{classAverage}%</div>
        <div className="text-sm text-gray-600">Overall Class Average</div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="value"
              fill="#3B82F6"
              name="Average Score (%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Assessment types show regular performance, exam types show test performance
      </div>
    </div>
  );
};

export default ClassAverageChart;