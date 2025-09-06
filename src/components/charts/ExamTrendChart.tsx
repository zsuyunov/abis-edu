"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExamTrendChartProps {
  data: Array<{
    examName: string;
    date: string;
    averageScore: number;
    passPercentage: number;
  }>;
}

const ExamTrendChart = ({ data }: ExamTrendChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">No exam data available for trend analysis</p>
      </div>
    );
  }

  // Sort data by date for proper trend line
  const sortedData = data
    .map(item => ({
      ...item,
      shortName: item.examName.length > 15 ? item.examName.substring(0, 15) + '...' : item.examName,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Exam Performance Trends</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Average Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Pass Rate %</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="shortName" 
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip 
            formatter={(value: any, name: string) => [
              `${value}${name === 'passPercentage' ? '%' : ''}`,
              name === 'averageScore' ? 'Average Score' : 'Pass Rate'
            ]}
            labelFormatter={(label) => {
              const item = sortedData.find(d => d.shortName === label);
              return item ? `${item.examName} (${item.date})` : label;
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="averageScore" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            name="Average Score"
          />
          <Line 
            type="monotone" 
            dataKey="passPercentage" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
            name="Pass Rate %"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {sortedData.length >= 2 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-800 font-medium">Latest Average</p>
            <p className="text-2xl font-bold text-blue-600">
              {sortedData[sortedData.length - 1].averageScore}%
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-green-800 font-medium">Latest Pass Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {sortedData[sortedData.length - 1].passPercentage}%
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-800 font-medium">Trend</p>
            <p className={`text-2xl font-bold ${
              sortedData[sortedData.length - 1].averageScore > sortedData[0].averageScore 
                ? 'text-green-600' 
                : sortedData[sortedData.length - 1].averageScore < sortedData[0].averageScore
                ? 'text-red-600'
                : 'text-gray-600'
            }`}>
              {sortedData[sortedData.length - 1].averageScore > sortedData[0].averageScore 
                ? '📈 Improving' 
                : sortedData[sortedData.length - 1].averageScore < sortedData[0].averageScore
                ? '📉 Declining'
                : '➡️ Stable'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTrendChart;
