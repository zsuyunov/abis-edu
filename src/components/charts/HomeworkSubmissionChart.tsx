"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface HomeworkSubmissionChartProps {
  data: Record<string, number>;
  totalSubmissions: number;
}

const HomeworkSubmissionChart = ({ data, totalSubmissions }: HomeworkSubmissionChartProps) => {
  // Transform data for the chart
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    percentage: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0,
  })).filter(item => item.value > 0);

  const colors = {
    'Submitted': "#10B981", // Green
    'Late': "#F59E0B", // Yellow
    'Not Submitted': "#EF4444", // Red
    'Graded': "#3B82F6", // Blue
  };

  const getColor = (name: string) => {
    return colors[name as keyof typeof colors] || "#6B7280";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.value}</span> submissions ({data.percentage}%)
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
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Homework Submission Status</h3>
      
      {totalSubmissions === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No submission data available
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
                  <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: getColor(item.name) }}
                ></div>
                <div className="text-xs">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-gray-600">{item.value} ({item.percentage}%)</div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Insights */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total: </span>
                <span className="text-blue-600 font-semibold">{totalSubmissions}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Submitted: </span>
                <span className="text-green-600 font-semibold">
                  {((data.SUBMITTED || 0) + (data.GRADED || 0))} ({Math.round(((data.SUBMITTED || 0) + (data.GRADED || 0)) / totalSubmissions * 100)}%)
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Late: </span>
                <span className="text-yellow-600 font-semibold">
                  {data.LATE || 0} ({data.LATE ? Math.round((data.LATE / totalSubmissions) * 100) : 0}%)
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Missing: </span>
                <span className="text-red-600 font-semibold">
                  {data.NOT_SUBMITTED || 0} ({data.NOT_SUBMITTED ? Math.round((data.NOT_SUBMITTED / totalSubmissions) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-4">
            {(() => {
              const submissionRate = Math.round(((data.SUBMITTED || 0) + (data.LATE || 0) + (data.GRADED || 0)) / totalSubmissions * 100);
              const lateRate = Math.round((data.LATE || 0) / totalSubmissions * 100);
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-md border ${
                    submissionRate >= 85 ? 'bg-green-50 border-green-200' : 
                    submissionRate >= 70 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      submissionRate >= 85 ? 'text-green-800' : 
                      submissionRate >= 70 ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      Submission Rate
                    </div>
                    <div className={`text-lg font-bold ${
                      submissionRate >= 85 ? 'text-green-700' : 
                      submissionRate >= 70 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {submissionRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {submissionRate >= 85 ? 'Excellent performance' : 
                       submissionRate >= 70 ? 'Good performance' : 'Needs improvement'}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-md border ${
                    lateRate <= 10 ? 'bg-green-50 border-green-200' : 
                    lateRate <= 25 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      lateRate <= 10 ? 'text-green-800' : 
                      lateRate <= 25 ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      Late Submission Rate
                    </div>
                    <div className={`text-lg font-bold ${
                      lateRate <= 10 ? 'text-green-700' : 
                      lateRate <= 25 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {lateRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {lateRate <= 10 ? 'Very punctual' : 
                       lateRate <= 25 ? 'Moderate lateness' : 'High lateness concern'}
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

export default HomeworkSubmissionChart;
