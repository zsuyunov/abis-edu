"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
      name: 'Excellent',
      value: data.excellent,
      percentage: totalStudents > 0 ? Math.round((data.excellent / totalStudents) * 100) : 0,
      range: '90-100%',
    },
    {
      name: 'Good',
      value: data.good,
      percentage: totalStudents > 0 ? Math.round((data.good / totalStudents) * 100) : 0,
      range: '80-89%',
    },
    {
      name: 'Satisfactory',
      value: data.satisfactory,
      percentage: totalStudents > 0 ? Math.round((data.satisfactory / totalStudents) * 100) : 0,
      range: '70-79%',
    },
    {
      name: 'Needs Improvement',
      value: data.needsImprovement,
      percentage: totalStudents > 0 ? Math.round((data.needsImprovement / totalStudents) * 100) : 0,
      range: 'Below 70%',
    },
  ];

  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600 mb-1">{payload[0].payload.range}</p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{payload[0].value}</span> students ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Grade Distribution</h3>
      
      {totalStudents === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No grade data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: colors[index] }}
            ></div>
            <div className="text-xs">
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-gray-600">{item.value} ({item.percentage}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeDistributionChart;
