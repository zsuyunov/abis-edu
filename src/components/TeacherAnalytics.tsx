"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Target,
  Award,
  Download
} from "lucide-react";

interface AnalyticsData {
  totalLessons: number;
  completedLessons: number;
  pendingLessons: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  averageProgress: number;
  weeklyStats: {
    week: string;
    lessons: number;
    topics: number;
    progress: number;
  }[];
  subjectStats: {
    subject: string;
    lessons: number;
    topics: number;
    progress: number;
  }[];
  classStats: {
    class: string;
    lessons: number;
    topics: number;
    progress: number;
  }[];
  recentActivity: {
    date: string;
    action: string;
    subject: string;
    class: string;
  }[];
}

interface TeacherAnalyticsProps {
  teacherId: string;
  isSupervisor?: boolean;
}

const TeacherAnalytics = ({ teacherId, isSupervisor = false }: TeacherAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");

  useEffect(() => {
    fetchAnalytics();
  }, [teacherId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/teacher/analytics?teacherId=${teacherId}&timeRange=${timeRange}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;
    
    const csvContent = [
      ["Metric", "Value"],
      ["Total Lessons", analytics.totalLessons],
      ["Completed Lessons", analytics.completedLessons],
      ["Pending Lessons", analytics.pendingLessons],
      ["Total Topics", analytics.totalTopics],
      ["Completed Topics", analytics.completedTopics],
      ["In Progress Topics", analytics.inProgressTopics],
      ["Average Progress", `${analytics.averageProgress}%`],
    ];
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">No data available for the selected time period</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            {isSupervisor ? "Class-level analytics and insights" : "Your teaching performance and progress"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalLessons}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.completedLessons} completed
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Classwork Topics</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalTopics}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.completedTopics} completed
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Progress</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.averageProgress}%</p>
                <div className="mt-2">
                  <Progress value={analytics.averageProgress} className="w-full" />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.totalLessons > 0 
                    ? Math.round((analytics.completedLessons / analytics.totalLessons) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics.pendingLessons} pending
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Progress
            </CardTitle>
            <CardDescription>Your progress over the past weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.weeklyStats.map((week, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{week.week}</span>
                    <span className="text-sm text-gray-600">{week.progress}%</span>
                  </div>
                  <Progress value={week.progress} className="w-full" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{week.lessons} lessons</span>
                    <span>{week.topics} topics</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>Performance across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.subjectStats.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{subject.subject}</span>
                    <span className="text-sm text-gray-600">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="w-full" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{subject.lessons} lessons</span>
                    <span>{subject.topics} topics</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance (for supervisors) */}
      {isSupervisor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Class Performance
            </CardTitle>
            <CardDescription>Performance across your supervised classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.classStats.map((classData, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{classData.class}</h3>
                    <Badge variant="outline">{classData.progress}%</Badge>
                  </div>
                  <Progress value={classData.progress} className="w-full mb-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{classData.lessons} lessons</span>
                    <span>{classData.topics} topics</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your recent teaching activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-600">
                    {activity.subject} - {activity.class}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{activity.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your teaching milestones and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.completedLessons >= 10 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">10 Lessons Completed</span>
                </div>
                <p className="text-sm text-green-700">
                  Great job! You've completed 10 lessons.
                </p>
              </div>
            )}
            
            {analytics.averageProgress >= 80 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">High Performance</span>
                </div>
                <p className="text-sm text-blue-700">
                  Excellent! You maintain 80%+ progress.
                </p>
              </div>
            )}
            
            {analytics.totalTopics >= 50 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Content Creator</span>
                </div>
                <p className="text-sm text-purple-700">
                  Amazing! You've created 50+ classwork topics.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAnalytics;
