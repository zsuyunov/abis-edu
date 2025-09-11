"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentData {
  studentId: string;
  student: {
    firstName: string;
    lastName: string;
  };
  overallAverage: number;
  totalGrades: number;
  recentTrend: Array<{
    date: Date;
    value: number;
    type: string;
  }>;
}

interface PerformanceComparisonChartProps {
  studentStats: StudentData[];
  classAverage: number;
}

const PerformanceComparisonChart = ({ studentStats, classAverage }: PerformanceComparisonChartProps) => {
  // Transform data for scatter plot
  const chartData = studentStats.map(student => ({
    x: student.totalGrades, // Number of grades on X-axis
    y: student.overallAverage, // Average score on Y-axis
    name: `${student.student.firstName} ${student.student.lastName}`,
    size: Math.max(student.totalGrades * 2, 50), // Bubble size based on number of grades
    trend: student.recentTrend.length > 1
      ? student.recentTrend[student.recentTrend.length - 1].value - student.recentTrend[0].value
      : 0
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Average Score: {data.y}%
          </p>
          <p className="text-sm text-gray-600">
            Total Grades: {data.x}
          </p>
          {data.trend !== 0 && (
            <p className={`text-sm ${data.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Trend: {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const getBubbleColor = (average: number) => {
    if (average >= 90) return '#10B981'; // green
    if (average >= 80) return '#3B82F6'; // blue
    if (average >= 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Student Performance Comparison
      </h3>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 60,
              left: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Total Grades"
              domain={['dataMin', 'dataMax']}
              label={{ value: 'Number of Grades', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Average Score"
              domain={[0, 100]}
              label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Class average reference line */}
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="5 5" />

            <Scatter name="Students" data={chartData} fill="#8884d8">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBubbleColor(entry.y)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Excellent (90%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Good (80-89%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Satisfactory (70-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Needs Improvement (0-69%)</span>
        </div>
      </div>

      <div className="mt-2 text-center text-sm text-gray-600">
        Bubble size represents number of grades received
      </div>
    </div>
  );
};

export default PerformanceComparisonChart;