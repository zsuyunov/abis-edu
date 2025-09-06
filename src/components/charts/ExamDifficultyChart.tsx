"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ExamDifficultyChartProps {
  data: Array<{
    examName: string;
    averageScore: number;
    difficulty: string;
  }>;
}

const ExamDifficultyChart = ({ data }: ExamDifficultyChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">No exam data available for difficulty analysis</p>
      </div>
    );
  }

  const processedData = data.map(item => ({
    ...item,
    shortName: item.examName.length > 20 ? item.examName.substring(0, 20) + '...' : item.examName,
    color: item.difficulty === "EASY" ? "#10B981" : 
           item.difficulty === "MODERATE" ? "#F59E0B" : "#EF4444"
  }));

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "😊";
      case "MODERATE": return "😐";
      case "DIFFICULT": return "😰";
      default: return "❓";
    }
  };

  const getDifficultyCount = (difficulty: string) => {
    return data.filter(item => item.difficulty === difficulty).length;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Exam Difficulty Analysis</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Easy (≥70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Moderate (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Difficult (&lt;50%)</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="shortName" 
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            domain={[0, 100]}
            label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Average Score']}
            labelFormatter={(label) => {
              const item = data.find(d => d.examName.startsWith(label.replace('...', '')));
              return item ? item.examName : label;
            }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="averageScore" radius={[4, 4, 0, 0]}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">😊</div>
          <p className="text-green-800 font-medium">Easy Exams</p>
          <p className="text-2xl font-bold text-green-600">
            {getDifficultyCount("EASY")}
          </p>
          <p className="text-xs text-green-600 mt-1">Average ≥70%</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">😐</div>
          <p className="text-yellow-800 font-medium">Moderate Exams</p>
          <p className="text-2xl font-bold text-yellow-600">
            {getDifficultyCount("MODERATE")}
          </p>
          <p className="text-xs text-yellow-600 mt-1">Average 50-69%</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl mb-2">😰</div>
          <p className="text-red-800 font-medium">Difficult Exams</p>
          <p className="text-2xl font-bold text-red-600">
            {getDifficultyCount("DIFFICULT")}
          </p>
          <p className="text-xs text-red-600 mt-1">Average &lt;50%</p>
        </div>
      </div>
      
      {data.length > 0 && (
        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Most Challenging:</span> {" "}
            {data.find(item => item.averageScore === Math.min(...data.map(d => d.averageScore)))?.examName || "N/A"}
            {" "}({Math.min(...data.map(d => d.averageScore))}%)
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <span className="font-medium">Easiest:</span> {" "}
            {data.find(item => item.averageScore === Math.max(...data.map(d => d.averageScore)))?.examName || "N/A"}
            {" "}({Math.max(...data.map(d => d.averageScore))}%)
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamDifficultyChart;
