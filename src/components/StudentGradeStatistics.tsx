"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Award, BookOpen, Trophy, Target } from 'lucide-react';

interface StudentGradeStatisticsProps {
  studentId: string;
}

const StudentGradeStatistics: React.FC<StudentGradeStatisticsProps> = ({ studentId }) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7days' | '4weeks' | '12weeks' | 'year'>('7days');

  useEffect(() => {
    fetchGrades();
  }, [studentId, period]);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student-grades?view=statistics`, {
        headers: {
          'x-user-id': studentId
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use statistics directly from API
  const overallStats = statistics ? {
    average: Math.round(statistics.averageGrade || 0),
    highestGrade: Math.round(statistics.highestGrade || 0),
    lowestGrade: Math.round(statistics.lowestGrade || 0),
    totalGrades: statistics.totalGrades || 0
  } : { average: 0, highestGrade: 0, lowestGrade: 0, totalGrades: 0 };

  const gradeDistribution = statistics?.recentGrades ? (() => {
    const grades = statistics.recentGrades.map((g: any) => g.percentage || g.value);
    const distribution = {
      excellent: grades.filter((g: number) => g >= 90).length,
      good: grades.filter((g: number) => g >= 80 && g < 90).length,
      satisfactory: grades.filter((g: number) => g >= 70 && g < 80).length,
      needsImprovement: grades.filter((g: number) => g < 70).length,
    };

    return [
      { name: 'Excellent (90-100%)', value: distribution.excellent, color: '#10B981' },
      { name: 'Good (80-89%)', value: distribution.good, color: '#3B82F6' },
      { name: 'Satisfactory (70-79%)', value: distribution.satisfactory, color: '#F59E0B' },
      { name: 'Needs Improvement (<70%)', value: distribution.needsImprovement, color: '#EF4444' },
    ].filter(item => item.value > 0);
  })() : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Academic Performance
        </h3>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7days">Last 7 Days</option>
          <option value="4weeks">Last 4 Weeks</option>
          <option value="12weeks">Last 12 Weeks</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Overall Average</p>
              <p className="text-2xl font-bold text-blue-900">{overallStats.average}%</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Highest Grade</p>
              <p className="text-2xl font-bold text-yellow-900">{overallStats.highestGrade}%</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Lowest Grade</p>
              <p className="text-2xl font-bold text-orange-900">{overallStats.lowestGrade}%</p>
            </div>
            <Target className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Total Grades</p>
              <p className="text-2xl font-bold text-purple-900">{overallStats.totalGrades}</p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="w-full">
        <h4 className="text-md font-medium text-gray-900 mb-3">Grade Distribution</h4>
        <div className="h-64">
          {gradeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} grades`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No grade data available for the selected period</p>
              </div>
            </div>
          )}
        </div>
        {gradeDistribution.length > 0 && (
          <div className="mt-4 space-y-2">
            {gradeDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-700">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!statistics && (
        <div className="text-center py-8 text-gray-500">
          No grade data available for the selected period.
        </div>
      )}
    </div>
  );
};

export default StudentGradeStatistics;