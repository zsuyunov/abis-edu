"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherGradebookOverviewProps {
  teacherId: string;
  filters: any;
  onTeacherDataUpdate: (data: any) => void;
}

const TeacherGradebookOverview = ({ 
  teacherId, 
  filters, 
  onTeacherDataUpdate 
}: TeacherGradebookOverviewProps) => {
  const [grades, setGrades] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({});
  const [viewMode, setViewMode] = useState<"grades" | "exams" | "combined">("combined");

  useEffect(() => {
    fetchOverviewData();
  }, [teacherId, filters]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch grades
      const gradesParams = new URLSearchParams({
        teacherId,
        view: "overview",
        ...filters,
      });
      
      // Fetch exam results  
      const examParams = new URLSearchParams({
        teacherId,
        view: "overview",
        ...filters,
      });

      const [gradesResponse, examResponse] = await Promise.all([
        fetch(`/api/teacher-grades?${gradesParams}`),
        fetch(`/api/teacher-exam-results?${examParams}`)
      ]);

      if (gradesResponse.ok && examResponse.ok) {
        const gradesData = await gradesResponse.json();
        const examData = await examResponse.json();
        
        setGrades(gradesData.grades || []);
        setExamResults(examData.examResults || []);
        setSummary({
          grades: gradesData.summary,
          exams: examData.summary,
        });
        
        onTeacherDataUpdate(gradesData);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
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

  const getGradeColor = (value: number) => {
    if (value >= 90) return "text-green-600 bg-green-100";
    if (value >= 70) return "text-blue-600 bg-blue-100";
    if (value >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getExamStatusColor = (status: string) => {
    return status === "PASS" 
      ? "text-green-600 bg-green-100" 
      : "text-red-600 bg-red-100";
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
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Total Grades</h3>
              <p className="text-2xl font-bold text-blue-600">
                {summary.grades?.totalGrades || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="Grades" width={24} height={24} className="invert" />
            </div>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            Average: {summary.grades?.averageGrade || 0}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-900">Exam Results</h3>
              <p className="text-2xl font-bold text-green-600">
                {summary.exams?.totalResults || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Image src="/exam.png" alt="Exams" width={24} height={24} className="invert" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-700">
            Pass Rate: {summary.exams?.passRate || 0}%
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-900">Average Score</h3>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(((summary.grades?.averageGrade || 0) + (summary.exams?.averageScore || 0)) / 2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Image src="/student.png" alt="Performance" width={24} height={24} className="invert" />
            </div>
          </div>
          <div className="mt-2 text-sm text-purple-700">
            Combined Performance
          </div>
        </div>
      </div>

      {/* VIEW MODE SELECTOR */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setViewMode("combined")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "combined"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📊 Combined View
        </button>
        <button
          onClick={() => setViewMode("grades")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "grades"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📝 Grades Only
        </button>
        <button
          onClick={() => setViewMode("exams")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "exams"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🎯 Exams Only
        </button>
      </div>

      {/* COMBINED VIEW */}
      {viewMode === "combined" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          
          {/* Combine and sort recent items */}
          {(() => {
            const combinedItems = [
              ...grades.slice(0, 10).map((grade: any) => ({
                ...grade,
                type: "grade",
                date: grade.date,
              })),
              ...examResults.slice(0, 10).map((result: any) => ({
                ...result,
                type: "exam",
                date: result.exam.date,
              })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return combinedItems.length > 0 ? (
              <div className="space-y-3">
                {combinedItems.slice(0, 15).map((item: any, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {item.type === "grade" ? (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getGradeTypeIcon(item.type)}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.student.firstName} {item.student.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {item.subject.name} • {item.class.name}
                              </p>
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-700 mt-2">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(item.value)}`}>
                            {item.value}/{item.maxValue}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(item.date)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.type.toUpperCase()} Grade
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🎯</span>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.student.firstName} {item.student.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {item.exam.title} • {item.exam.subject.name}
                              </p>
                            </div>
                          </div>
                          {item.feedback && (
                            <p className="text-sm text-gray-700 mt-2">{item.feedback}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getExamStatusColor(item.status)}`}>
                            {item.marksObtained}/{item.exam.totalMarks} ({item.status})
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(item.date)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Exam Result
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Image 
                  src="/result.png" 
                  alt="No data" 
                  width={64} 
                  height={64} 
                  className="mx-auto mb-4 opacity-50"
                />
                <h4 className="font-medium text-gray-900 mb-2">No Grades or Results Yet</h4>
                <p className="text-gray-600 text-sm">
                  Start by selecting a class and subject to input grades, or choose an exam to enter results.
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* GRADES ONLY VIEW */}
      {viewMode === "grades" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Grade Records</h3>
            <div className="text-sm text-gray-600">
              {grades.length} grades found
            </div>
          </div>
          
          {grades.length > 0 ? (
            <div className="space-y-3">
              {grades.map((grade: any) => (
                <div key={grade.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getGradeTypeIcon(grade.type)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {grade.student.firstName} {grade.student.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {grade.subject.name} • {grade.class.name}
                          </p>
                        </div>
                      </div>
                      {grade.description && (
                        <p className="text-sm text-gray-700 mt-2">{grade.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.value)}`}>
                        {grade.value}/{grade.maxValue}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(grade.date)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {grade.type} Grade
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image 
                src="/result.png" 
                alt="No grades" 
                width={64} 
                height={64} 
                className="mx-auto mb-4 opacity-50"
              />
              <h4 className="font-medium text-gray-900 mb-2">No Grades Found</h4>
              <p className="text-gray-600 text-sm">
                Use the Grade Input section to add grades for your students.
              </p>
            </div>
          )}
        </div>
      )}

      {/* EXAMS ONLY VIEW */}
      {viewMode === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Exam Results</h3>
            <div className="text-sm text-gray-600">
              {examResults.length} results found
            </div>
          </div>
          
          {examResults.length > 0 ? (
            <div className="space-y-3">
              {examResults.map((result: any) => (
                <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🎯</span>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {result.student.firstName} {result.student.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {result.exam.title} • {result.exam.subject.name}
                          </p>
                        </div>
                      </div>
                      {result.feedback && (
                        <p className="text-sm text-gray-700 mt-2">{result.feedback}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getExamStatusColor(result.status)}`}>
                        {result.marksObtained}/{result.exam.totalMarks} ({result.status})
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(result.exam.date)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Exam Result
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image 
                src="/exam.png" 
                alt="No results" 
                width={64} 
                height={64} 
                className="mx-auto mb-4 opacity-50"
              />
              <h4 className="font-medium text-gray-900 mb-2">No Exam Results Found</h4>
              <p className="text-gray-600 text-sm">
                Use the Exam Results section to enter results for your assigned exams.
              </p>
            </div>
          )}
        </div>
      )}

      {/* QUICK STATS */}
      {(grades.length > 0 || examResults.length > 0) && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600">{summary.grades?.totalGrades || 0}</div>
              <div className="text-gray-600">Total Grades</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{summary.exams?.totalResults || 0}</div>
              <div className="text-gray-600">Exam Results</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">{summary.grades?.averageGrade || 0}</div>
              <div className="text-gray-600">Avg Grade</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">{summary.exams?.passRate || 0}%</div>
              <div className="text-gray-600">Pass Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGradebookOverview;
