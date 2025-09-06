"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StudentAttendanceChartsProps {
  studentId: string;
  filters: any;
  timeFilter: string;
  attendanceData: any;
  onDataUpdate: (data: any) => void;
}

const StudentAttendanceCharts = ({
  studentId,
  filters,
  timeFilter,
  attendanceData,
  onDataUpdate,
}: StudentAttendanceChartsProps) => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>({});

  useEffect(() => {
    fetchAnalyticsData();
  }, [studentId, filters, timeFilter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId,
        timeFilter,
        view: "analytics",
        ...filters,
      });

      const response = await fetch(`/api/student-attendance?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analytics || {});
        onDataUpdate({ ...attendanceData, analytics: data.analytics });
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📊</div>
        <div className="text-gray-600">Loading your attendance analytics...</div>
      </div>
    );
  }

  const { 
    summary = {}, 
    subjectStats = [], 
    trends = [], 
    monthlyStats = [], 
    weeklyStats = [],
    insights = [] 
  } = analyticsData;

  // Create simple visual charts using CSS and HTML
  const renderTrendChart = () => {
    if (trends.length === 0) return null;

    const maxRate = Math.max(...trends.map((t: any) => t.attendanceRate));
    const minRate = Math.min(...trends.map((t: any) => t.attendanceRate));
    const range = maxRate - minRate || 1;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📈</span>
          Attendance Trend Over Time
        </h3>
        
        <div className="h-64 flex items-end justify-between gap-1 px-2">
          {trends.slice(-20).map((trend: any, index: number) => {
            const height = ((trend.attendanceRate - minRate) / range) * 100;
            const barHeight = Math.max(height, 5); // Minimum height for visibility
            
            return (
              <div key={index} className="flex flex-col items-center group relative">
                <div
                  className={`w-6 rounded-t transition-all duration-300 ${
                    trend.attendanceRate >= 95 ? 'bg-green-500 hover:bg-green-600' :
                    trend.attendanceRate >= 85 ? 'bg-blue-500 hover:bg-blue-600' :
                    trend.attendanceRate >= 75 ? 'bg-yellow-500 hover:bg-yellow-600' :
                    'bg-red-500 hover:bg-red-600'
                  }`}
                  style={{ height: `${barHeight}%` }}
                ></div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {new Date(trend.date).toLocaleDateString()}<br/>
                  {trend.attendanceRate}% attendance
                </div>
                
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                  {new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{minRate}%</span>
          <span>{maxRate}%</span>
        </div>
      </div>
    );
  };

  const renderStatusPieChart = () => {
    const total = summary.totalRecords || 1;
    const present = summary.presentCount || 0;
    const absent = summary.absentCount || 0;
    const late = summary.lateCount || 0;
    const excused = summary.excusedCount || 0;

    const segments = [
      { label: "Present", value: present, color: "bg-green-500", percentage: Math.round((present / total) * 100) },
      { label: "Absent", value: absent, color: "bg-red-500", percentage: Math.round((absent / total) * 100) },
      { label: "Late", value: late, color: "bg-yellow-500", percentage: Math.round((late / total) * 100) },
      { label: "Excused", value: excused, color: "bg-purple-500", percentage: Math.round((excused / total) * 100) },
    ].filter(segment => segment.value > 0);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🍕</span>
          Attendance Status Distribution
        </h3>
        
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-48 h-48">
            {/* Simple donut chart using CSS */}
            <div className="w-full h-full rounded-full bg-gray-200 relative overflow-hidden">
              {segments.map((segment, index) => {
                let rotation = 0;
                for (let i = 0; i < index; i++) {
                  rotation += (segments[i].percentage / 100) * 360;
                }
                
                return (
                  <div
                    key={segment.label}
                    className={`absolute inset-0 ${segment.color.replace('bg-', 'border-')} border-8`}
                    style={{
                      borderRadius: '50%',
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.sin((rotation * Math.PI) / 180) * 50}% ${50 - Math.cos((rotation * Math.PI) / 180) * 50}%, ${50 + Math.sin(((rotation + (segment.percentage / 100) * 360) * Math.PI) / 180) * 50}% ${50 - Math.cos(((rotation + (segment.percentage / 100) * 360) * Math.PI) / 180) * 50}%)`,
                    }}
                  ></div>
                );
              })}
              
              {/* Center circle */}
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{summary.attendanceRate}%</div>
                  <div className="text-xs text-gray-600">Overall</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
              <div className="text-sm">
                <span className="font-medium">{segment.label}</span>
                <span className="text-gray-600 ml-1">({segment.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubjectBarChart = () => {
    if (subjectStats.length <= 1) return null;

    const maxRate = Math.max(...subjectStats.map((s: any) => s.attendanceRate));

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span>
          Subject-wise Attendance Rates
        </h3>
        
        <div className="space-y-3">
          {subjectStats.map((subject: any, index: number) => (
            <div key={subject.subject.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {subject.subject.name}
                </span>
                <span className={`text-sm font-bold ${
                  subject.attendanceRate >= 95 ? 'text-green-600' :
                  subject.attendanceRate >= 85 ? 'text-blue-600' :
                  subject.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {subject.attendanceRate}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    subject.attendanceRate >= 95 ? 'bg-green-500' :
                    subject.attendanceRate >= 85 ? 'bg-blue-500' :
                    subject.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${subject.attendanceRate}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-600 mt-1">
                {subject.presentCount} present, {subject.absentCount} absent out of {subject.totalRecords} classes
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthlyChart = () => {
    if (monthlyStats.length === 0) return null;

    const maxRate = Math.max(...monthlyStats.map((m: any) => m.attendanceRate));

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📅</span>
          Monthly Attendance Progress
        </h3>
        
        <div className="space-y-3">
          {monthlyStats.map((month: any, index: number) => (
            <div key={month.month} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {month.monthName}
                </span>
                <span className={`text-sm font-bold ${
                  month.attendanceRate >= 95 ? 'text-green-600' :
                  month.attendanceRate >= 85 ? 'text-blue-600' :
                  month.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {month.attendanceRate}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    month.attendanceRate >= 95 ? 'bg-green-500' :
                    month.attendanceRate >= 85 ? 'bg-blue-500' :
                    month.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${month.attendanceRate}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-600 mt-1">
                {month.presentCount} present, {month.absentCount} absent out of {month.totalRecords} classes
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* OVERALL SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.totalRecords || 0}</div>
          <div className="text-sm text-gray-600">Total Classes</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.attendanceRate || 0}%</div>
          <div className="text-sm text-green-700">Attendance Rate</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{100 - (summary.lateRate || 0)}%</div>
          <div className="text-sm text-blue-700">Punctuality Rate</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{subjectStats.length}</div>
          <div className="text-sm text-purple-700">Subjects Tracked</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">
        {renderTrendChart()}
        {renderStatusPieChart()}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {renderSubjectBarChart()}
        {renderMonthlyChart()}
      </div>

      {/* INSIGHTS */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
          <h3 className="font-semibold text-cyan-900 mb-4 flex items-center gap-2">
            <span>💡</span>
            Your Attendance Insights
          </h3>
          
          <div className="space-y-3">
            {insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-md">
                <div className="text-cyan-600 mt-0.5">
                  {insight.includes("Outstanding") || insight.includes("excellent") ? "🌟" :
                   insight.includes("Good") ? "👍" :
                   insight.includes("improvement") || insight.includes("improving") ? "📈" :
                   insight.includes("attention") || insight.includes("declined") ? "⚠️" :
                   insight.includes("Best") ? "🏆" : "💡"}
                </div>
                <div className="text-sm text-cyan-800">
                  {insight}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERFORMANCE TIPS */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎯</span>
          Tips to Improve Your Attendance
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">⏰</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Set Consistent Sleep Schedule</div>
                <div className="text-xs text-gray-600">Go to bed and wake up at the same time daily</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-green-600 mt-0.5">📱</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Use Reminders</div>
                <div className="text-xs text-gray-600">Set phone alarms for class times and preparation</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-purple-600 mt-0.5">🎒</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Prepare the Night Before</div>
                <div className="text-xs text-gray-600">Pack your bag and plan your outfit in advance</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 mt-0.5">🚌</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Plan Your Commute</div>
                <div className="text-xs text-gray-600">Allow extra time for transportation delays</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-red-600 mt-0.5">💪</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Stay Healthy</div>
                <div className="text-xs text-gray-600">Eat well, exercise, and stay hydrated</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-cyan-600 mt-0.5">🎯</div>
              <div>
                <div className="text-sm font-medium text-gray-900">Set Goals</div>
                <div className="text-xs text-gray-600">Aim for specific attendance targets each month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NO DATA STATE */}
      {summary.totalRecords === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">
            No attendance data found for analysis. Attend more classes to see detailed charts and insights.
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
            💡 <strong>Tip:</strong> Regular attendance for a few weeks will generate meaningful analytics and insights.
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceCharts;
