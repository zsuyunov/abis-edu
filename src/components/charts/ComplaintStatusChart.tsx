"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ComplaintStatusChartProps {
  data: Record<string, number>;
  totalComplaints: number;
}

const ComplaintStatusChart = ({ data, totalComplaints }: ComplaintStatusChartProps) => {
  // Transform data for the chart
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0,
  }));

  const getBarColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return "#F59E0B"; // Yellow
      case 'IN REVIEW': return "#3B82F6"; // Blue
      case 'RESOLVED': return "#10B981"; // Green
      case 'REJECTED': return "#EF4444"; // Red
      default: return "#6B7280"; // Gray
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.value}</span> complaints ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Complaints by Status</h3>
      
      {totalComplaints === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No complaint data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {chartData.map((item) => (
              <div key={item.name} className="text-center p-3 bg-gray-50 rounded-md border">
                <div 
                  className="text-lg font-bold mb-1"
                  style={{ color: getBarColor(item.name) }}
                >
                  {item.value}
                </div>
                <div className="text-xs font-medium text-gray-700 mb-1">{item.name}</div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            ))}
          </div>

          {/* Resolution Metrics */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Resolution Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium text-blue-700">Total: </span>
                <span className="text-blue-600 font-semibold">{totalComplaints}</span>
              </div>
              <div>
                <span className="font-medium text-green-700">Resolved: </span>
                <span className="text-green-600 font-semibold">
                  {data.RESOLVED || 0} ({data.RESOLVED ? Math.round((data.RESOLVED / totalComplaints) * 100) : 0}%)
                </span>
              </div>
              <div>
                <span className="font-medium text-yellow-700">Pending: </span>
                <span className="text-yellow-600 font-semibold">
                  {(data.PENDING || 0) + (data.IN_REVIEW || 0)} ({Math.round(((data.PENDING || 0) + (data.IN_REVIEW || 0)) / totalComplaints * 100)}%)
                </span>
              </div>
              <div>
                <span className="font-medium text-red-700">Rejected: </span>
                <span className="text-red-600 font-semibold">
                  {data.REJECTED || 0} ({data.REJECTED ? Math.round((data.REJECTED / totalComplaints) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-4 space-y-2">
            {(() => {
              const resolvedRate = data.RESOLVED ? Math.round((data.RESOLVED / totalComplaints) * 100) : 0;
              const pendingRate = Math.round(((data.PENDING || 0) + (data.IN_REVIEW || 0)) / totalComplaints * 100);
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-md border ${
                    resolvedRate >= 80 ? 'bg-green-50 border-green-200' : 
                    resolvedRate >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      resolvedRate >= 80 ? 'text-green-800' : 
                      resolvedRate >= 60 ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      Resolution Rate
                    </div>
                    <div className={`text-lg font-bold ${
                      resolvedRate >= 80 ? 'text-green-700' : 
                      resolvedRate >= 60 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {resolvedRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {resolvedRate >= 80 ? 'Excellent' : resolvedRate >= 60 ? 'Good' : 'Needs Attention'}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-md border ${
                    pendingRate <= 20 ? 'bg-green-50 border-green-200' : 
                    pendingRate <= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      pendingRate <= 20 ? 'text-green-800' : 
                      pendingRate <= 40 ? 'text-yellow-800' : 'text-red-800'
                    }`}>
                      Pending Rate
                    </div>
                    <div className={`text-lg font-bold ${
                      pendingRate <= 20 ? 'text-green-700' : 
                      pendingRate <= 40 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {pendingRate}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {pendingRate <= 20 ? 'Low Backlog' : pendingRate <= 40 ? 'Moderate' : 'High Backlog'}
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

export default ComplaintStatusChart;
