"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentGradeStats {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  overallAverage: number | null;
  totalGrades: number;
}

interface PerformanceComparisonChartProps {
  studentStats: StudentGradeStats[];
  classAverage: number;
}

const PerformanceComparisonChart = ({ studentStats, classAverage }: PerformanceComparisonChartProps) => {
  // Filter and sort students with valid averages
  const validStudents = studentStats
    .filter(student => student.overallAverage !== null)
    .sort((a, b) => (b.overallAverage || 0) - (a.overallAverage || 0))
    .slice(0, 10); // Show top 10 students

  // Transform data for the chart
  const chartData = validStudents.map((student, index) => ({
    name: `${student.student.firstName} ${student.student.lastName}`,
    shortName: `${student.student.firstName.charAt(0)}${student.student.lastName.charAt(0)}`,
    studentId: student.student.studentId,
    average: Math.round(student.overallAverage || 0),
    totalGrades: student.totalGrades,
    rank: index + 1,
    aboveAverage: (student.overallAverage || 0) > classAverage,
  }));

  const getBarColor = (value: number, isAboveAverage: boolean) => {
    if (value >= 90) return "#10B981"; // Green - Excellent
    if (value >= 80) return "#3B82F6"; // Blue - Good
    if (value >= 70) return "#F59E0B"; // Yellow - Satisfactory
    return "#EF4444"; // Red - Needs Improvement
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">ID: {data.studentId}</p>
          <p className="text-sm text-blue-600">
            Average: <span className="font-semibold">{data.average}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Total Grades: {data.totalGrades}
          </p>
          <p className="text-xs text-gray-500">
            Rank: #{data.rank} in class
          </p>
          <p className="text-xs">
            <span className={data.aboveAverage ? 'text-green-600' : 'text-red-600'}>
              {data.aboveAverage ? '📈 Above' : '📉 Below'} class average
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Student Performance</h3>
      
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No student data available
        </div>
      ) : (
        <>
          {/* Class Average Reference */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Class Average Benchmark</span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(classAverage)}%
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="shortName" 
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{ value: 'Average (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line for class average */}
              <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.average, entry.aboveAverage)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Performance Tiers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="text-center p-2 bg-green-50 rounded-md border border-green-200">
              <div className="text-lg font-bold text-green-600">
                {chartData.filter(s => s.average >= 90).length}
              </div>
              <div className="text-xs text-green-700">Excellent (90%+)</div>
            </div>
            
            <div className="text-center p-2 bg-blue-50 rounded-md border border-blue-200">
              <div className="text-lg font-bold text-blue-600">
                {chartData.filter(s => s.average >= 80 && s.average < 90).length}
              </div>
              <div className="text-xs text-blue-700">Good (80-89%)</div>
            </div>
            
            <div className="text-center p-2 bg-yellow-50 rounded-md border border-yellow-200">
              <div className="text-lg font-bold text-yellow-600">
                {chartData.filter(s => s.average >= 70 && s.average < 80).length}
              </div>
              <div className="text-xs text-yellow-700">Satisfactory (70-79%)</div>
            </div>
            
            <div className="text-center p-2 bg-red-50 rounded-md border border-red-200">
              <div className="text-lg font-bold text-red-600">
                {chartData.filter(s => s.average < 70).length}
              </div>
              <div className="text-xs text-red-700">Needs Support (&lt;70%)</div>
            </div>
          </div>

          {/* Top Performers List */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Top 3 Performers</h4>
            <div className="space-y-2">
              {chartData.slice(0, 3).map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-600">ID: {student.studentId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      student.average >= 90 ? 'text-green-600' :
                      student.average >= 80 ? 'text-blue-600' :
                      student.average >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {student.average}%
                    </div>
                    <div className="text-xs text-gray-500">{student.totalGrades} grades</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Performance Insights */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Performance Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Above Average: </span>
                <span className="text-green-600">
                  {chartData.filter(s => s.aboveAverage).length} students
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Below Average: </span>
                <span className="text-red-600">
                  {chartData.filter(s => !s.aboveAverage).length} students
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Highest Score: </span>
                <span className="text-green-600">
                  {Math.max(...chartData.map(s => s.average))}%
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Score Range: </span>
                <span className="text-blue-600">
                  {Math.max(...chartData.map(s => s.average)) - Math.min(...chartData.map(s => s.average))}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceComparisonChart;
