"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GradeDistributionChartProps {
  data: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
  };
  totalStudents: number;
}

const GradeDistributionChart = ({ data, totalStudents }: GradeDistributionChartProps) => {
  const chartData = [
    {
      name: 'Excellent (90%+)',
      value: data.excellent,
      color: '#10B981', // green-500
      percentage: totalStudents > 0 ? Math.round((data.excellent / totalStudents) * 100) : 0
    },
    {
      name: 'Good (80-89%)',
      value: data.good,
      color: '#3B82F6', // blue-500
      percentage: totalStudents > 0 ? Math.round((data.good / totalStudents) * 100) : 0
    },
    {
      name: 'Satisfactory (70-79%)',
      value: data.satisfactory,
      color: '#F59E0B', // yellow-500
      percentage: totalStudents > 0 ? Math.round((data.satisfactory / totalStudents) * 100) : 0
    },
    {
      name: 'Needs Improvement (0-69%)',
      value: data.needsImprovement,
      color: '#EF4444', // red-500
      percentage: totalStudents > 0 ? Math.round((data.needsImprovement / totalStudents) * 100) : 0
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.name}</p>
          <p className="text-sm text-gray-600">
            Students: {data.value} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Grade Distribution
      </h3>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Excellent: {data.excellent}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Good: {data.good}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Satisfactory: {data.satisfactory}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Needs Improvement: {data.needsImprovement}</span>
        </div>
      </div>
    </div>
  );
};

export default GradeDistributionChart;
