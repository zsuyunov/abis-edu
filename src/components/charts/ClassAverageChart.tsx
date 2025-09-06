"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ClassAverageChartProps {
  data: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
    termly: number | null;
    yearly: number | null;
    examMidterm: number | null;
    examFinal: number | null;
    examNational: number | null;
  };
  classAverage: number;
}

const ClassAverageChart = ({ data, classAverage }: ClassAverageChartProps) => {
  // Transform data for the chart
  const chartData = Object.entries(data)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Exam ', ''),
      value: Math.round(value as number),
      fullName: key,
    }));

  const getBarColor = (value: number) => {
    if (value >= 90) return "#10B981"; // Green - Excellent
    if (value >= 80) return "#3B82F6"; // Blue - Good
    if (value >= 70) return "#F59E0B"; // Yellow - Satisfactory
    return "#EF4444"; // Red - Needs Improvement
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Average: <span className="font-semibold">{value}%</span>
          </p>
          <p className="text-xs text-gray-500">
            {value >= 90 ? 'Excellent Performance' :
             value >= 80 ? 'Good Performance' :
             value >= 70 ? 'Satisfactory Performance' : 'Needs Improvement'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Class Performance by Grade Type</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No grade data available
        </div>
      ) : (
        <>
          {/* Overall Class Average Banner */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Overall Class Average</span>
              <span className={`text-lg font-bold px-3 py-1 rounded ${
                classAverage >= 90 ? 'bg-green-100 text-green-800' :
                classAverage >= 80 ? 'bg-blue-100 text-blue-800' :
                classAverage >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {Math.round(classAverage)}%
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{ value: 'Average (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Performance Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {chartData.slice(0, 4).map((item) => (
              <div key={item.name} className="text-center p-2 bg-gray-50 rounded-md">
                <div className={`text-lg font-bold ${
                  item.value >= 90 ? 'text-green-600' :
                  item.value >= 80 ? 'text-blue-600' :
                  item.value >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {item.value}%
                </div>
                <div className="text-xs text-gray-600 truncate">{item.name}</div>
              </div>
            ))}
          </div>

          {/* Performance Insights */}
          <div className="mt-4 space-y-2">
            {(() => {
              const highestPerforming = chartData.reduce((max, item) => 
                item.value > max.value ? item : max
              );
              const lowestPerforming = chartData.reduce((min, item) => 
                item.value < min.value ? item : min
              );
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-md border border-green-200">
                    <div className="text-sm font-medium text-green-800">Strongest Area</div>
                    <div className="text-green-700">
                      {highestPerforming.name} ({highestPerforming.value}%)
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-800">Focus Area</div>
                    <div className="text-yellow-700">
                      {lowestPerforming.name} ({lowestPerforming.value}%)
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassAverageChart;
