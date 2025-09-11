"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Calendar,
  Users,
  Award
} from "lucide-react";

interface TeacherTimetableAnalyticsProps {
  teacherId: string;
  teacherData: any;
  relatedData: {
    branches: any[];
    classes: any[];
    subjects: any[];
    supervisedClasses: any[];
  };
  filters: any;
}

const TeacherTimetableAnalytics = ({ teacherId, teacherData, relatedData, filters }: TeacherTimetableAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [teacherId, filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        ...filters,
      });

      const response = await fetch(`/api/teacher-timetables/analytics?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Teaching Analytics</h2>
            <p className="text-orange-600">Performance insights & progress tracking</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Analytics coming soon</p>
          <p className="text-gray-400">This feature is under development</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const topicStatusData = [
    { name: "Completed", value: analytics.topicStats.COMPLETED, color: "#10b981" },
    { name: "In Progress", value: analytics.topicStats.IN_PROGRESS, color: "#3b82f6" },
    { name: "Draft", value: analytics.topicStats.DRAFT, color: "#6b7280" },
    { name: "Cancelled", value: analytics.topicStats.CANCELLED, color: "#ef4444" },
  ].filter(item => item.value > 0);

  const subjectProgressData = analytics.subjectProgress.map((subject: any) => ({
    name: subject.subject,
    total: subject.total,
    withTopics: subject.withTopics,
    completionRate: subject.completionRate,
  }));

  const classProgressData = analytics.classProgress.map((cls: any) => ({
    name: cls.class.name,
    total: cls.totalLessons,
    withTopics: cls.lessonsWithTopics,
    completionRate: cls.completionRate,
  }));

  return (
    <div className="space-y-6">
      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Lessons</p>
              <p className="text-2xl font-bold">{analytics.overview.totalLessons}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
              <Image src="/lesson.png" alt="Lessons" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Lessons with Topics</p>
              <p className="text-2xl font-bold">{analytics.overview.lessonsWithTopics}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
              <Image src="/create.png" alt="Topics" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold">{analytics.overview.completionRate}%</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
              <Image src="/result.png" alt="Completion" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOPIC STATUS CHART */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Topic Status Distribution</h3>
          {topicStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topicStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No topic data available
            </div>
          )}
          
          <div className="mt-4 space-y-2">
            {topicStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SUBJECT PROGRESS CHART */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Progress by Subject</h3>
          {subjectProgressData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#e5e7eb" name="Total Lessons" />
                  <Bar dataKey="withTopics" fill="#3b82f6" name="With Topics" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No subject data available
            </div>
          )}
        </div>
      </div>

      {/* CLASS PROGRESS (FOR SUPERVISORS) */}
      {analytics.isSupervisor && classProgressData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Class Progress (Supervisor View)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#e5e7eb" name="Total Lessons" />
                <Bar dataKey="withTopics" fill="#10b981" name="With Topics" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* UPCOMING LESSONS WITHOUT TOPICS */}
      {analytics.upcomingLessonsWithoutTopics.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image src="/calendar.png" alt="Calendar" width={20} height={20} />
            Upcoming Lessons Without Topics
          </h3>
          <div className="space-y-3">
            {analytics.upcomingLessonsWithoutTopics.map((lesson: any) => (
              <div 
                key={lesson.id} 
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {lesson.subject.name} • {lesson.class.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(lesson.fullDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })} • {new Date(lesson.startTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })} - {new Date(lesson.endTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    Room: {lesson.roomNumber}
                  </div>
                </div>
                <div className="text-yellow-600 text-sm font-medium">
                  No Topic
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROGRESS DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SUBJECT DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Subject Details</h3>
          <div className="space-y-3">
            {subjectProgressData.map((subject: any, index: number) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{subject.name}</span>
                  <span className="text-sm text-gray-600">{subject.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${subject.completionRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{subject.withTopics} with topics</span>
                  <span>{subject.total} total lessons</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOPIC STATISTICS */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Topic Statistics</h3>
          <div className="space-y-4">
            {Object.entries(analytics.topicStats).map(([status, count]: [string, any]) => {
              if (count === 0) return null;
              
              const statusColors = {
                COMPLETED: "text-green-600 bg-green-100",
                IN_PROGRESS: "text-blue-600 bg-blue-100",
                DRAFT: "text-gray-600 bg-gray-100",
                CANCELLED: "text-red-600 bg-red-100",
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                      {status.replace('_', ' ')}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetableAnalytics;
