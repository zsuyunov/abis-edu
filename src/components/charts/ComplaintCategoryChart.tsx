"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ComplaintCategoryChartProps {
  data: Record<string, number>;
  totalComplaints: number;
}

const ComplaintCategoryChart = ({ data, totalComplaints }: ComplaintCategoryChartProps) => {
  // Transform data for the chart
  const chartData = Object.entries(data).map(([category, count]) => ({
    name: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
  })).filter(item => item.value > 0);

  const colors = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#F59E0B", // Yellow
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#84CC16", // Lime
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.value}</span> complaints ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Complaints by Category</h3>
      
      {totalComplaints === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No complaint data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <div className="text-xs">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-gray-600">{item.value} ({item.percentage}%)</div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total: </span>
                <span className="text-blue-600 font-semibold">{totalComplaints}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Categories: </span>
                <span className="text-green-600 font-semibold">{chartData.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Most Common: </span>
                <span className="text-purple-600 font-semibold truncate">
                  {chartData.length > 0 ? chartData[0].name : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Highest %: </span>
                <span className="text-orange-600 font-semibold">
                  {chartData.length > 0 ? `${chartData[0].percentage}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComplaintCategoryChart;
