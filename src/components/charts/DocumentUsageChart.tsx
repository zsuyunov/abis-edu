"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DocumentUsageChartProps {
  uploadsData: Record<string, number>;
  downloadsData: Record<string, number>;
  totalDocuments: number;
  totalDownloads: number;
}

const DocumentUsageChart = ({ uploadsData, downloadsData, totalDocuments, totalDownloads }: DocumentUsageChartProps) => {
  // Combine upload and download data
  const allDates = new Set([...Object.keys(uploadsData), ...Object.keys(downloadsData)]);
  
  const chartData = Array.from(allDates)
    .map(date => ({
      date,
      uploads: uploadsData[date] || 0,
      downloads: downloadsData[date] || 0,
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
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              <span className="font-semibold">{data.uploads}</span> documents uploaded
            </p>
            <p className="text-sm text-green-600">
              <span className="font-semibold">{data.downloads}</span> downloads
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const avgUploads = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, d) => sum + d.uploads, 0) / chartData.length * 10) / 10
    : 0;
  
  const avgDownloads = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, d) => sum + d.downloads, 0) / chartData.length * 10) / 10
    : 0;

  const maxUploads = Math.max(...chartData.map(d => d.uploads));
  const maxDownloads = Math.max(...chartData.map(d => d.downloads));

  // Calculate engagement rate (downloads per document)
  const engagementRate = totalDocuments > 0 ? Math.round((totalDownloads / totalDocuments) * 100) / 100 : 0;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Document Activity (Last 30 Days)</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No activity data available
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded-md">
              <div className="text-lg font-bold text-blue-600">{totalDocuments}</div>
              <div className="text-xs text-blue-700">Total Docs</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-md">
              <div className="text-lg font-bold text-green-600">{totalDownloads}</div>
              <div className="text-xs text-green-700">Total Downloads</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-md">
              <div className="text-lg font-bold text-purple-600">{engagementRate}</div>
              <div className="text-xs text-purple-700">Avg Downloads/Doc</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-md">
              <div className="text-lg font-bold text-orange-600">{maxDownloads}</div>
              <div className="text-xs text-orange-700">Peak Day</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Uploads Line */}
              <Line
                type="monotone"
                dataKey="uploads"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                name="Uploads"
              />
              
              {/* Downloads Line */}
              <Line
                type="monotone"
                dataKey="downloads"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                name="Downloads"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Activity Analysis */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Upload Activity</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-700">Daily Average:</span>
                  <span className="text-blue-600 font-semibold">{avgUploads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Peak Day:</span>
                  <span className="text-blue-600 font-semibold">{maxUploads} uploads</span>
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  {maxUploads > avgUploads * 2 ? 
                    "📈 High activity periods detected" : 
                    "➡️ Consistent upload activity"
                  }
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Download Engagement</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-700">Daily Average:</span>
                  <span className="text-green-600 font-semibold">{avgDownloads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Peak Day:</span>
                  <span className="text-green-600 font-semibold">{maxDownloads} downloads</span>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  {engagementRate > 2 ? 
                    "🔥 High engagement rate" : 
                    engagementRate > 1 ? 
                    "✅ Good engagement" : 
                    "📊 Building engagement"
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Usage Insights */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Usage Insights</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {(() => {
                const downloadRatio = totalDocuments > 0 ? totalDownloads / totalDocuments : 0;
                if (downloadRatio > 3) {
                  return <p>📈 <strong>Excellent engagement:</strong> Documents are being actively downloaded and used.</p>;
                } else if (downloadRatio > 1.5) {
                  return <p>✅ <strong>Good usage:</strong> Most documents are being accessed by users.</p>;
                } else if (downloadRatio > 0.5) {
                  return <p>📊 <strong>Moderate engagement:</strong> Consider promoting documents or improving targeting.</p>;
                } else {
                  return <p>💡 <strong>Low engagement:</strong> Review document relevance and promotion strategies.</p>;
                }
              })()}
              
              <p className="text-xs text-gray-500 mt-2">
                Recommendation: {engagementRate < 1 ? 
                  "Focus on document quality and user training" : 
                  "Continue current document management practices"
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentUsageChart;
