"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface StudentTimetableProgressProps {
  studentId: string;
  filters: any;
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentTimetableProgress = ({ 
  studentId, 
  filters, 
  timeFilter,
  onStudentDataUpdate 
}: StudentTimetableProgressProps) => {
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [studentId, filters, timeFilter]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
        view: "progress",
        timeFilter,
      });

      const response = await fetch(`/api/student-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
        onStudentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-md"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Image
          src="/nodata.png"
          alt="No data"
          width={64}
          height={64}
          className="mx-auto mb-4"
        />
        <p>Unable to load progress data.</p>
      </div>
    );
  }

  const { progressStats, subjectProgress } = progressData;

  // Prepare chart data
  const overallProgressData = [
    { name: "Lessons with Topics", value: progressStats.lessonsWithTopics, color: "#10b981" },
    { name: "Lessons without Topics", value: progressStats.totalLessons - progressStats.lessonsWithTopics, color: "#e5e7eb" },
  ];

  const topicStatusData = [
    { name: "Completed", value: progressStats.completedTopics, color: "#10b981" },
    { name: "In Progress", value: progressStats.inProgressTopics, color: "#3b82f6" },
  ].filter(item => item.value > 0);

  const subjectProgressChart = subjectProgress.map((subject: any) => ({
    name: subject.subject.length > 10 ? subject.subject.substring(0, 10) + "..." : subject.subject,
    fullName: subject.subject,
    totalLessons: subject.totalLessons,
    withTopics: subject.lessonsWithTopics,
    completionRate: subject.completionRate,
    totalTopics: subject.totalTopics,
    completedTopics: subject.completedTopics,
  }));

  const completionRate = progressStats.totalLessons > 0 
    ? Math.round((progressStats.lessonsWithTopics / progressStats.totalLessons) * 100)
    : 0;

  const topicCompletionRate = (progressStats.completedTopics + progressStats.inProgressTopics) > 0
    ? Math.round((progressStats.completedTopics / (progressStats.completedTopics + progressStats.inProgressTopics)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Learning Progress Overview</h2>
        {timeFilter === "past" && (
          <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            📚 Archived Data
          </span>
        )}
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Lessons</p>
              <p className="text-2xl font-bold">{progressStats.totalLessons}</p>
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
              <p className="text-2xl font-bold">{progressStats.lessonsWithTopics}</p>
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
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
              <Image src="/result.png" alt="Completion" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Topics Completed</p>
              <p className="text-2xl font-bold">{progressStats.completedTopics}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 p-3 rounded-full">
              <Image src="/assignment.png" alt="Completed" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OVERALL PROGRESS PIE CHART */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Overall Lesson Coverage</h3>
          {overallProgressData.some(item => item.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallProgressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {overallProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No lesson data available
            </div>
          )}
          
          <div className="mt-4 space-y-2">
            {overallProgressData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.name}: {item.value} ({Math.round((item.value / progressStats.totalLessons) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOPIC STATUS PIE CHART */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Topic Completion Status</h3>
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
            <div className="text-sm text-gray-600 mt-2">
              Overall Topic Completion: {topicCompletionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* SUBJECT PROGRESS BAR CHART */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Progress by Subject</h3>
        {subjectProgressChart.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgressChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    value,
                    name,
                    `Subject: ${props.payload.fullName}`
                  ]}
                />
                <Bar dataKey="totalLessons" fill="#e5e7eb" name="Total Lessons" />
                <Bar dataKey="withTopics" fill="#3b82f6" name="Lessons with Topics" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No subject data available
          </div>
        )}
      </div>

      {/* DETAILED SUBJECT PROGRESS */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Detailed Subject Progress</h3>
        <div className="space-y-4">
          {subjectProgress.map((subject: any, index: number) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                <span className="text-sm text-gray-600">{subject.completionRate}%</span>
              </div>
              
              {/* PROGRESS BAR */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${subject.completionRate}%` }}
                ></div>
              </div>
              
              {/* DETAILED STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-blue-600">{subject.totalLessons}</div>
                  <div className="text-gray-600">Total Lessons</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-green-600">{subject.lessonsWithTopics}</div>
                  <div className="text-gray-600">With Topics</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-purple-600">{subject.totalTopics}</div>
                  <div className="text-gray-600">Total Topics</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-orange-600">{subject.completedTopics}</div>
                  <div className="text-gray-600">Completed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LEARNING INSIGHTS */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <Image src="/result.png" alt="Insights" width={20} height={20} />
          Learning Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Your Progress</h4>
            <div className="space-y-2 text-sm">
              {completionRate >= 80 && (
                <div className="text-green-600">🎉 Excellent! You're covering most of your lessons with topics.</div>
              )}
              {completionRate >= 60 && completionRate < 80 && (
                <div className="text-blue-600">👍 Good progress! Keep engaging with your lesson topics.</div>
              )}
              {completionRate < 60 && (
                <div className="text-orange-600">📚 There's room for improvement in topic coverage.</div>
              )}
              
              {topicCompletionRate >= 80 && (
                <div className="text-green-600">✅ Great job completing your topics!</div>
              )}
              {progressStats.totalLessons > 0 && (
                <div className="text-gray-600">
                  You have {progressStats.totalLessons} total lessons 
                  {timeFilter === "current" ? " this term" : " in the archive"}.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {progressStats.inProgressTopics > 0 && (
                <div>📖 You have {progressStats.inProgressTopics} topics in progress.</div>
              )}
              {timeFilter === "current" && (
                <div>🎯 Keep checking back for new topics from your teachers.</div>
              )}
              <div>💡 Use lesson topics to prepare for exams and assignments.</div>
              {timeFilter === "current" && (
                <div>📅 Review your upcoming classes in the weekly view.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetableProgress;
