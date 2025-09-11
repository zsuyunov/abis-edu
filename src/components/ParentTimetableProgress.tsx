/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ParentTimetableProgressProps {
  parentId: string;
  childId: string;
  filters: any;
  timeFilter: "current" | "past";
  onParentDataUpdate: (data: any) => void;
}

const ParentTimetableProgress = ({ 
  parentId,
  childId, 
  filters, 
  timeFilter,
  onParentDataUpdate 
}: ParentTimetableProgressProps) => {
  const [progressData, setProgressData] = useState<any>(null);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [parentId, childId, filters, timeFilter]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        parentId,
        childId,
        ...filters,
        view: "progress",
        timeFilter,
      });

      const response = await fetch(`/api/parent-timetables?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
        setSelectedChild(data.selectedChild);
        onParentDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-100";
    if (percentage >= 60) return "text-blue-600 bg-blue-100";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load progress data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER }
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {selectedChild?.firstName}'s Learning Progress
        </h2>
        <p className="text-gray-600">
          Track your child's academic progress and subject completion rates
        </p>
        {timeFilter === "past" && (
          <span className="inline-block mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            📚 Historical Data
          </span>
        )}
      </div>

      {/* OVERALL PROGRESS SUMMARY }
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Image src="/result.png" alt="Progress" width={20} height={20} />
          Overall Progress Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {progressData.progressStats?.totalLessons || 0}
            </div>
            <div className="text-sm text-gray-600">Total Lessons</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-green-600">
              {progressData.progressStats?.lessonsWithTopics || 0}
            </div>
            <div className="text-sm text-gray-600">With Content</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-purple-600">
              {progressData.progressStats?.completedTopics || 0}
            </div>
            <div className="text-sm text-gray-600">Completed Topics</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-orange-600">
              {progressData.progressStats?.inProgressTopics || 0}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>

        {/* Overall Completion Rate }
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Completion Rate</span>
            <span className="text-sm font-bold text-gray-900">
              {progressData.progressStats?.totalLessons > 0 
                ? Math.round((progressData.progressStats.lessonsWithTopics / progressData.progressStats.totalLessons) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                getProgressBarColor(
                  progressData.progressStats?.totalLessons > 0 
                    ? Math.round((progressData.progressStats.lessonsWithTopics / progressData.progressStats.totalLessons) * 100)
                    : 0
                )
              }`}
              style={{ 
                width: `${progressData.progressStats?.totalLessons > 0 
                  ? Math.round((progressData.progressStats.lessonsWithTopics / progressData.progressStats.totalLessons) * 100)
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* SUBJECT-WISE PROGRESS }
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Image src="/subject.png" alt="Subjects" width={20} height={20} />
            Subject-wise Progress
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Monitor progress across different subjects to identify strengths and areas for improvement
          </p>
        </div>

        {progressData.subjectProgress && progressData.subjectProgress.length > 0 ? (
          <div className="p-4 space-y-4">
            {progressData.subjectProgress.map((subject: any) => (
              <div key={subject.subjectId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressColor(subject.completionRate)}`}>
                    {subject.completionRate}% Complete
                  </span>
                </div>

                {/* Progress Bar }
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(subject.completionRate)}`}
                      style={{ width: `${subject.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Subject Stats }
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-gray-900">{subject.totalLessons}</div>
                    <div className="text-gray-600">Total Lessons</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-600">{subject.lessonsWithTopics}</div>
                    <div className="text-gray-600">With Content</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-bold text-purple-600">{subject.totalTopics}</div>
                    <div className="text-gray-600">Total Topics</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-600">{subject.completedTopics}</div>
                    <div className="text-gray-600">Completed</div>
                  </div>
                </div>

                {/* Progress Insights }
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  {subject.completionRate >= 80 ? (
                    <div className="text-green-700 flex items-center gap-2">
                      <span>🎉</span>
                      <span>Excellent progress! {selectedChild?.firstName} is doing great in {subject.subject}.</span>
                    </div>
                  ) : subject.completionRate >= 60 ? (
                    <div className="text-blue-700 flex items-center gap-2">
                      <span>👍</span>
                      <span>Good progress in {subject.subject}. Keep up the momentum!</span>
                    </div>
                  ) : subject.completionRate >= 40 ? (
                    <div className="text-yellow-700 flex items-center gap-2">
                      <span>📚</span>
                      <span>Steady progress in {subject.subject}. Consider additional study time.</span>
                    </div>
                  ) : (
                    <div className="text-red-700 flex items-center gap-2">
                      <span>💪</span>
                      <span>{subject.subject} needs more attention. Consider discussing with the teacher.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Image 
              src="/result.png" 
              alt="No data" 
              width={64} 
              height={64} 
              className="mx-auto mb-4 opacity-50"
            />
            <h4 className="font-medium text-gray-900 mb-2">No Progress Data Available</h4>
            <p className="text-gray-600 text-sm">
              Progress tracking will appear as teachers add lesson content and mark topics as complete.
            </p>
          </div>
        )}
      </div>

      {/* PERFORMANCE INSIGHTS }
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
          <Image src="/parent.png" alt="Insights" width={20} height={20} />
          Performance Insights for Parents
        </h3>
        
        <div className="space-y-3 text-sm text-yellow-800">
          {progressData.progressStats?.totalLessons > 0 && (
            <>
              <div className="flex items-start gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <strong>Coverage Rate:</strong> {Math.round((progressData.progressStats.lessonsWithTopics / progressData.progressStats.totalLessons) * 100)}% of lessons have learning content provided by teachers.
                </div>
              </div>
              
              {progressData.progressStats.completedTopics > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <strong>Completion Rate:</strong> {Math.round((progressData.progressStats.completedTopics / (progressData.progressStats.completedTopics + progressData.progressStats.inProgressTopics)) * 100)}% of active topics have been completed.
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <span className="text-lg">🏠</span>
                <div>
                  <strong>Home Support:</strong> Use this progress overview to discuss daily learning with {selectedChild?.firstName} and plan home study sessions.
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-lg">👨‍🏫</span>
                <div>
                  <strong>Teacher Communication:</strong> If any subject shows low progress, consider reaching out to the subject teacher for additional support strategies.
                </div>
              </div>
            </>
          )}
          
          {progressData.progressStats?.totalLessons === 0 && (
            <div className="flex items-start gap-2">
              <span className="text-lg">📅</span>
              <div>
                No lesson data available for the selected time period. This could be a break period or the academic session hasn't started yet.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACADEMIC PERIOD INFO }
      {progressData.currentAcademicYear && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-900">Academic Period:</span>
              <span className="ml-2 text-gray-600">{progressData.currentAcademicYear.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Period:</span>
              <span className="ml-2 text-gray-600">
                {new Date(progressData.currentAcademicYear.startDate).toLocaleDateString()} - {new Date(progressData.currentAcademicYear.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentTimetableProgress;


*/