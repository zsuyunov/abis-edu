"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExamDifficultyChartProps {
  data: Array<{
    examName: string;
    difficulty: number; // 1-10 scale
    averageScore: number;
    passRate: number;
  }>;
}

const ExamDifficultyChart = ({ data }: ExamDifficultyChartProps) => {
  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.examName.length > 15 ? item.examName.substring(0, 15) + '...' : item.examName,
    fullName: item.examName,
    difficulty: item.difficulty,
    averageScore: item.averageScore,
    passRate: item.passRate,
    difficultyLevel: item.difficulty <= 3 ? 'Easy' : item.difficulty <= 7 ? 'Moderate' : 'Hard'
  }));

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return '#10B981'; // Easy - green
    if (difficulty <= 7) return '#F59E0B'; // Moderate - yellow
    return '#EF4444'; // Hard - red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.fullName}</p>
          <p className="text-sm text-gray-600">
            Difficulty: {data.payload.difficulty}/10 ({data.payload.difficultyLevel})
          </p>
          <p className="text-sm text-gray-600">
            Average Score: {data.payload.averageScore}%
          </p>
          <p className="text-sm text-gray-600">
            Pass Rate: {data.payload.passRate}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Exam Difficulty Analysis
      </h3>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Difficulty (1-10)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="difficulty"
              name="Difficulty Level"
              radius={[4, 4, 0, 0]}
              fill="#8884d8"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Easy (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Moderate (4-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Hard (8-10)</span>
        </div>
      </div>

      <div className="mt-2 text-center text-sm text-gray-600">
        Higher difficulty levels indicate more challenging exams
      </div>
    </div>
  );
};

export default ExamDifficultyChart;