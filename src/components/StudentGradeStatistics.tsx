"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Award, BookOpen } from 'lucide-react';

interface StudentGradeStatisticsProps {
  studentId: string;
}

interface GradeData {
  id: string;
  grade: number;
  date: string;
  subject: {
    id: string;
    name: string;
  };
}

interface SubjectAverage {
  subject: string;
  average: number;
  count: number;
}

interface WeeklyAverage {
  week: string;
  average: number;
}

const StudentGradeStatistics: React.FC<StudentGradeStatisticsProps> = ({ studentId }) => {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7days' | '4weeks' | '12weeks' | 'year'>('4weeks');

  useEffect(() => {
    fetchGrades();
  }, [studentId, period]);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/grades?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGrades = () => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '4weeks':
        cutoffDate.setDate(now.getDate() - 28);
        break;
      case '12weeks':
        cutoffDate.setDate(now.getDate() - 84);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return Array.isArray(grades) ? grades.filter(grade => new Date(grade.date) >= cutoffDate) : [];
  };

  const getSubjectAverages = (): SubjectAverage[] => {
    const filteredGrades = getFilteredGrades();
    const subjectGroups = filteredGrades.reduce((acc, grade) => {
      const subjectName = grade.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      acc[subjectName].push(grade.grade);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(subjectGroups).map(([subject, gradeList]) => ({
      subject,
      average: Math.round(gradeList.reduce((sum, grade) => sum + grade, 0) / gradeList.length),
      count: gradeList.length
    }));
  };

  const getWeeklyAverages = (): WeeklyAverage[] => {
    const filteredGrades = getFilteredGrades();
    const weekGroups = filteredGrades.reduce((acc, grade) => {
      const date = new Date(grade.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = [];
      }
      acc[weekKey].push(grade.grade);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(weekGroups)
      .map(([week, gradeList]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        average: Math.round(gradeList.reduce((sum, grade) => sum + grade, 0) / gradeList.length)
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8); // Last 8 weeks
  };

  const getOverallStats = () => {
    const filteredGrades = getFilteredGrades();
    if (filteredGrades.length === 0) return { average: 0, trend: 0, totalGrades: 0 };

    const average = Math.round(
      filteredGrades.reduce((sum, grade) => sum + grade.grade, 0) / filteredGrades.length
    );

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(filteredGrades.length / 2);
    const firstHalf = filteredGrades.slice(0, midPoint);
    const secondHalf = filteredGrades.slice(midPoint);

    const firstAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, grade) => sum + grade.grade, 0) / firstHalf.length 
      : 0;
    const secondAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, grade) => sum + grade.grade, 0) / secondHalf.length 
      : 0;

    const trend = secondAvg - firstAvg;

    return {
      average,
      trend: Math.round(trend * 10) / 10,
      totalGrades: filteredGrades.length
    };
  };

  const getGradeDistribution = () => {
    const filteredGrades = getFilteredGrades();
    const distribution = {
      excellent: filteredGrades.filter(g => g.grade >= 90).length,
      good: filteredGrades.filter(g => g.grade >= 80 && g.grade < 90).length,
      satisfactory: filteredGrades.filter(g => g.grade >= 70 && g.grade < 80).length,
      needsImprovement: filteredGrades.filter(g => g.grade < 70).length,
    };

    return [
      { name: 'Excellent (90-100%)', value: distribution.excellent, color: '#10B981' },
      { name: 'Good (80-89%)', value: distribution.good, color: '#3B82F6' },
      { name: 'Satisfactory (70-79%)', value: distribution.satisfactory, color: '#F59E0B' },
      { name: 'Needs Improvement (<70%)', value: distribution.needsImprovement, color: '#EF4444' },
    ].filter(item => item.value > 0);
  };

  const subjectAverages = getSubjectAverages();
  const weeklyAverages = getWeeklyAverages();
  const overallStats = getOverallStats();
  const gradeDistribution = getGradeDistribution();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Overall Average</p>
              <p className="text-2xl font-bold text-blue-900">{overallStats.average}%</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Trend</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-green-900">
                  {overallStats.trend > 0 ? '+' : ''}{overallStats.trend}%
                </p>
                {overallStats.trend > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : overallStats.trend < 0 ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : null}
              </div>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Averages */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Subject Performance</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value}%`, 'Average']}
                  labelFormatter={(label) => `Subject: ${label}`}
                />
                <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Grade Distribution</h4>
          <div className="h-64">
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
          </div>
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
        </div>
      </div>

      {/* Weekly Trend */}
      {weeklyAverages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Weekly Average Trend</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Weekly Average']}
                />
                <Bar dataKey="average" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {grades.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No grade data available for the selected period.
        </div>
      )}
    </div>
  );
};

export default StudentGradeStatistics;
