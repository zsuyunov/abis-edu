"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StudentGradebookOverviewProps {
  studentId: string;
  filters: any;
  timeFilter: "current" | "past";
  onStudentDataUpdate: (data: any) => void;
}

const StudentGradebookOverview = ({ 
  studentId, 
  filters, 
  timeFilter,
  onStudentDataUpdate 
}: StudentGradebookOverviewProps) => {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState<any>({});
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"all" | "daily" | "weekly" | "monthly" | "termly" | "yearly">("all");

  useEffect(() => {
    fetchGradeData();
  }, [studentId, filters, timeFilter]);

  const fetchGradeData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId,
        view: "overview",
        timeFilter,
        ...filters,
      });

      const response = await fetch(`/api/student-gradebook?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
        setSummary(data.summary || {});
        setSubjectStats(data.subjectStats || []);
        onStudentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching grade data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getGradeColor = (value: number, maxValue: number = 100) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 90) return "text-green-700 bg-green-100 border-green-300";
    if (percentage >= 70) return "text-blue-700 bg-blue-100 border-blue-300";
    if (percentage >= 50) return "text-yellow-700 bg-yellow-100 border-yellow-300";
    return "text-red-700 bg-red-100 border-red-300";
  };

  const getGradeTypeIcon = (type: string) => {
    switch (type) {
      case "DAILY": return "📅";
      case "WEEKLY": return "📊";
      case "MONTHLY": return "📈";
      case "TERMLY": return "🏆";
      case "YEARLY": return "🎯";
      default: return "📝";
    }
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excellent", color: "text-green-600", emoji: "🌟" };
    if (percentage >= 70) return { level: "Good", color: "text-blue-600", emoji: "👍" };
    if (percentage >= 50) return { level: "Fair", color: "text-yellow-600", emoji: "📚" };
    return { level: "Needs Improvement", color: "text-red-600", emoji: "💪" };
  };

  const filteredGrades = viewMode === "all" ? grades : grades.filter((grade: any) => grade.type === viewMode.toUpperCase());

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ACADEMIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Overall Average</h3>
              <p className="text-2xl font-bold text-blue-600">
                {summary.overallAverage || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Average" width={24} height={24} className="invert" />
            </div>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            {summary.totalGrades || 0} grades recorded
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-900">Highest Score</h3>
              <p className="text-2xl font-bold text-green-600">
                {summary.highestScore || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Image src="/student.png" alt="Highest" width={24} height={24} className="invert" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-700">
            Personal best achievement
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-900">Grade Average</h3>
              <p className="text-2xl font-bold text-purple-600">
                {summary.averageGrade || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Image src="/exam.png" alt="Grade Average" width={24} height={24} className="invert" />
            </div>
          </div>
          <div className="mt-2 text-sm text-purple-700">
            From regular assessments
          </div>
        </div>
      </div>

      {/* GRADE TYPE FILTER */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "all"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📊 All Grades
        </button>
        <button
          onClick={() => setViewMode("daily")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "daily"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📅 Daily
        </button>
        <button
          onClick={() => setViewMode("weekly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "weekly"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📊 Weekly
        </button>
        <button
          onClick={() => setViewMode("monthly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "monthly"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📈 Monthly
        </button>
        <button
          onClick={() => setViewMode("termly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "termly"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🏆 Termly
        </button>
      </div>

      {/* SUBJECT PERFORMANCE OVERVIEW */}
      {subjectStats.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your performance across different subjects
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((subject: any) => {
              const performance = getPerformanceLevel(subject.overallAverage);
              return (
                <div key={subject.subject.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{subject.subject.name}</h4>
                    <span className={`text-lg ${performance.color}`}>
                      {performance.emoji}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average:</span>
                      <span className={`font-medium ${performance.color}`}>
                        {subject.overallAverage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Level:</span>
                      <span className={`font-medium ${performance.color}`}>
                        {performance.level}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Grades:</span>
                      <span className="text-gray-900">{subject.totalGrades}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Exams:</span>
                      <span className="text-gray-900">{subject.totalExams}</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            subject.overallAverage >= 90 ? "bg-green-500" :
                            subject.overallAverage >= 70 ? "bg-blue-500" :
                            subject.overallAverage >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(subject.overallAverage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRADE RECORDS TABLE */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {viewMode === "all" ? "All Grade Records" : `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Grades`}
            </h3>
            <div className="text-sm text-gray-600">
              {filteredGrades.length} grade{filteredGrades.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {filteredGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGrades.map((grade: any) => {
                  const percentage = Math.round((grade.value / grade.maxValue) * 100);
                  return (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(grade.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {grade.subject.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{getGradeTypeIcon(grade.type)}</span>
                          {grade.type}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getGradeColor(grade.value, grade.maxValue)}`}>
                          {grade.value}/{grade.maxValue}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            percentage >= 90 ? "text-green-600" :
                            percentage >= 70 ? "text-blue-600" :
                            percentage >= 50 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {percentage}%
                          </span>
                          <div className={`w-16 h-2 rounded-full ${
                            percentage >= 90 ? "bg-green-200" :
                            percentage >= 70 ? "bg-blue-200" :
                            percentage >= 50 ? "bg-yellow-200" : "bg-red-200"
                          }`}>
                            <div 
                              className={`h-2 rounded-full ${
                                percentage >= 90 ? "bg-green-500" :
                                percentage >= 70 ? "bg-blue-500" :
                                percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {grade.teacher.firstName} {grade.teacher.lastName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {grade.description || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Image 
              src="/result.png" 
              alt="No grades" 
              width={64} 
              height={64} 
              className="mx-auto mb-4 opacity-50"
            />
            <h4 className="font-medium text-gray-900 mb-2">No Grades Found</h4>
            <p className="text-gray-600 text-sm">
              {viewMode === "all" 
                ? "No grades have been recorded yet for the selected period."
                : `No ${viewMode} grades found for the selected filters.`
              }
            </p>
          </div>
        )}
      </div>

      {/* PERFORMANCE INSIGHTS */}
      {filteredGrades.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            Performance Insights
          </h4>
          <div className="text-sm text-blue-800 space-y-2">
            {summary.overallAverage >= 90 && (
              <div className="flex items-center gap-2">
                <span>🌟</span>
                <span>Outstanding performance! You're consistently achieving excellent results.</span>
              </div>
            )}
            {summary.overallAverage >= 70 && summary.overallAverage < 90 && (
              <div className="flex items-center gap-2">
                <span>👍</span>
                <span>Good work! Keep up the momentum to reach excellence.</span>
              </div>
            )}
            {summary.overallAverage >= 50 && summary.overallAverage < 70 && (
              <div className="flex items-center gap-2">
                <span>📚</span>
                <span>Steady progress. Consider spending more time on challenging subjects.</span>
              </div>
            )}
            {summary.overallAverage < 50 && (
              <div className="flex items-center gap-2">
                <span>💪</span>
                <span>Focus on improvement. Talk to your teachers for additional support and study strategies.</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              <span>📈</span>
              <span>
                You have {summary.totalGrades} grades recorded. 
                {summary.highestScore > summary.averageGrade + 10 && 
                  " Your highest score shows you have the potential to improve further!"
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGradebookOverview;
