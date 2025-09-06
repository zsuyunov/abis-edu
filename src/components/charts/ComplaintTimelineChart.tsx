"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ComplaintTimelineChartProps {
  data: Record<string, number>;
  totalComplaints: number;
}

const ComplaintTimelineChart = ({ data, totalComplaints }: ComplaintTimelineChartProps) => {
  // Transform and sort data for the chart
  const chartData = Object.entries(data)
    .map(([date, count]) => ({
      date,
      count,
      formattedDate: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(date)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Show last 30 days

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date(data.date))}
          </p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.count}</span> complaints received
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate trends and statistics
  const maxComplaints = Math.max(...chartData.map(d => d.count));
  const avgComplaints = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, d) => sum + d.count, 0) / chartData.length * 10) / 10
    : 0;

  // Calculate trend (comparing first half vs second half)
  const midPoint = Math.ceil(chartData.length / 2);
  const firstHalf = chartData.slice(0, midPoint);
  const secondHalf = chartData.slice(midPoint);
  
  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length
    : 0;
  
  const trend = secondHalfAvg - firstHalfAvg;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Complaints Timeline (Last 30 Days)</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No timeline data available
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded-md">
              <div className="text-lg font-bold text-blue-600">{totalComplaints}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-md">
              <div className="text-lg font-bold text-green-600">{avgComplaints}</div>
              <div className="text-xs text-green-700">Daily Avg</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-md">
              <div className="text-lg font-bold text-purple-600">{maxComplaints}</div>
              <div className="text-xs text-purple-700">Peak Day</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-md">
              <div className={`text-lg font-bold ${
                trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '➡️'}
              </div>
              <div className="text-xs text-gray-700">Trend</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 11 }}
                interval={Math.ceil(chartData.length / 8)} // Show ~8 labels max
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Complaints', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.1}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Trend Analysis */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Trend Analysis</h4>
            <div className="text-sm">
              {trend > 1 ? (
                <div className="text-red-600">
                  📈 <span className="font-medium">Increasing trend:</span> Complaints are rising by {Math.round(trend * 10) / 10} per day on average. Consider investigating common issues.
                </div>
              ) : trend < -1 ? (
                <div className="text-green-600">
                  📉 <span className="font-medium">Decreasing trend:</span> Complaints are decreasing by {Math.round(Math.abs(trend) * 10) / 10} per day on average. Good progress in resolving issues.
                </div>
              ) : (
                <div className="text-gray-600">
                  ➡️ <span className="font-medium">Stable trend:</span> Complaint volume is relatively stable with minor fluctuations.
                </div>
              )}
            </div>
          </div>

          {/* Peak Analysis */}
          {chartData.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-1">Peak Activity</h4>
              <div className="text-sm text-yellow-700">
                {(() => {
                  const peakDay = chartData.reduce((max, day) => day.count > max.count ? day : max);
                  return `Highest activity: ${peakDay.count} complaints on ${
                    new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      day: "numeric",
                    }).format(new Date(peakDay.date))
                  }`;
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComplaintTimelineChart;
