"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface HomeworkTrendsChartProps {
  submissionTrends: Record<string, number>;
  subjectStats: Record<string, number>;
  totalHomework: number;
}

const HomeworkTrendsChart = ({ submissionTrends, subjectStats, totalHomework }: HomeworkTrendsChartProps) => {
  // Transform submission trends data
  const trendsData = Object.entries(submissionTrends)
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

  // Transform subject stats data
  const subjectData = Object.entries(subjectStats)
    .map(([subject, count]) => ({
      subject: subject.length > 15 ? subject.substring(0, 15) + '...' : subject,
      fullSubject: subject,
      count,
      percentage: totalHomework > 0 ? Math.round((count / totalHomework) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Show top 8 subjects

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">
            {data.formattedDate || data.fullSubject}
          </p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.count}</span> homework assigned
            {data.percentage && ` (${data.percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const SubjectTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullSubject}</p>
          <p className="text-sm text-blue-600">
            <span className="font-semibold">{data.count}</span> homework ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Homework Assignment Trends */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Homework Assignment Trends</h3>
        
        {trendsData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No trends data available
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 bg-blue-50 rounded-md">
                <div className="text-lg font-bold text-blue-600">{totalHomework}</div>
                <div className="text-xs text-blue-700">Total Homework</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-md">
                <div className="text-lg font-bold text-green-600">
                  {trendsData.length > 0 
                    ? Math.round(trendsData.reduce((sum, d) => sum + d.count, 0) / trendsData.length * 10) / 10
                    : 0
                  }
                </div>
                <div className="text-xs text-green-700">Daily Average</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-md">
                <div className="text-lg font-bold text-purple-600">
                  {Math.max(...trendsData.map(d => d.count))}
                </div>
                <div className="text-xs text-purple-700">Peak Day</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-md">
                <div className="text-lg font-bold text-orange-600">
                  {Object.keys(subjectStats).length}
                </div>
                <div className="text-xs text-orange-700">Subjects</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11 }}
                  interval={Math.ceil(trendsData.length / 8)}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Homework Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Subject Distribution */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Homework by Subject</h3>
        
        {subjectData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No subject data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Homework Count', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<SubjectTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Subject Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {subjectData.slice(0, 4).map((subject, index) => (
                <div key={subject.fullSubject} className="text-center p-2 bg-gray-50 rounded-md border">
                  <div className="text-lg font-bold text-green-600">{subject.count}</div>
                  <div className="text-xs font-medium text-gray-700 truncate" title={subject.fullSubject}>
                    {subject.subject}
                  </div>
                  <div className="text-xs text-gray-500">{subject.percentage}%</div>
                </div>
              ))}
            </div>

            {/* Subject Insights */}
            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Subject Analysis</h4>
              <div className="text-sm text-green-700">
                {(() => {
                  const topSubject = subjectData[0];
                  const totalSubjects = Object.keys(subjectStats).length;
                  
                  if (topSubject) {
                    return (
                      <>
                        <p>📚 <strong>Most Active Subject:</strong> {topSubject.fullSubject} with {topSubject.count} homework assignments ({topSubject.percentage}%)</p>
                        <p className="text-xs text-green-600 mt-1">
                          Distribution across {totalSubjects} subjects shows {
                            topSubject.percentage > 40 ? 'concentrated' : 
                            topSubject.percentage > 25 ? 'focused' : 'balanced'
                          } homework assignment patterns.
                        </p>
                      </>
                    );
                  }
                  return <p>No subject data available for analysis.</p>;
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeworkTrendsChart;
