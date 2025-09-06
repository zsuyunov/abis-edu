"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface StudentProgressChartProps {
  data: Array<{
    date: Date;
    value: number;
    type: string;
  }>;
  studentName: string;
}

const StudentProgressChart = ({ data, studentName }: StudentProgressChartProps) => {
  // Transform data for the chart
  const chartData = data.map((item, index) => ({
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(item.date)),
    value: item.value,
    type: item.type,
    fullDate: item.date,
    index: index + 1,
  })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  // Calculate average for reference line
  const average = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600 mb-1">
            {data.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getLineColor = (value: number) => {
    if (value >= 90) return "#10B981"; // Green
    if (value >= 80) return "#3B82F6"; // Blue
    if (value >= 70) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">Progress Trend</h3>
      <p className="text-sm text-gray-600 mb-4">{studentName}</p>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No progress data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              label={{ value: 'Grade (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference line for average */}
            <ReferenceLine 
              y={average} 
              stroke="#9CA3AF" 
              strokeDasharray="5 5" 
              label={{ value: `Avg: ${average}%`, position: "topRight" }}
            />
            
            {/* Grade boundaries */}
            <ReferenceLine y={90} stroke="#10B981" strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine y={80} stroke="#3B82F6" strokeDasharray="2 2" strokeOpacity={0.5} />
            <ReferenceLine y={70} stroke="#F59E0B" strokeDasharray="2 2" strokeOpacity={0.5} />
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Performance Indicators */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.max(...chartData.map(d => d.value))}%
            </div>
            <div className="text-xs text-gray-600">Highest</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {average}%
            </div>
            <div className="text-xs text-gray-600">Average</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {Math.min(...chartData.map(d => d.value))}%
            </div>
            <div className="text-xs text-gray-600">Lowest</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {chartData.length}
            </div>
            <div className="text-xs text-gray-600">Total Grades</div>
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {chartData.length >= 2 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Trend: </span>
            {(() => {
              const firstHalf = chartData.slice(0, Math.ceil(chartData.length / 2));
              const secondHalf = chartData.slice(Math.ceil(chartData.length / 2));
              const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
              const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
              const trend = secondAvg - firstAvg;
              
              if (trend > 5) {
                return <span className="text-green-600 font-medium">📈 Improving (+{Math.round(trend)}%)</span>;
              } else if (trend < -5) {
                return <span className="text-red-600 font-medium">📉 Declining ({Math.round(trend)}%)</span>;
              } else {
                return <span className="text-gray-600 font-medium">➡️ Stable ({Math.round(trend)}%)</span>;
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressChart;
