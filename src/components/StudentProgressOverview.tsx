"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  CheckCircle, 
  Clock,
  Target,
  Award,
  Calendar
} from "lucide-react";

interface SubjectProgress {
  subjectId: number;
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  averageProgress: number;
  lastUpdated: string;
}

interface OverallStats {
  totalSubjects: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  averageProgress: number;
  attendanceRate: number;
  upcomingExams: number;
}

interface StudentProgressOverviewProps {
  studentId: string;
  academicYearId: number;
}

const StudentProgressOverview = ({ studentId, academicYearId }: StudentProgressOverviewProps) => {
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [studentId, academicYearId]);

  const fetchProgressData = async () => {
    try {
      const response = await fetch(`/api/student/progress?studentId=${studentId}&academicYearId=${academicYearId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setSubjectProgress(data.subjectProgress || []);
      setOverallStats(data.overallStats || null);
    } catch (error) {
      console.error("Failed to fetch progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Overview</h2>
          <p className="text-gray-600">Track your learning progress across all subjects</p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                  <p className={`text-3xl font-bold ${getProgressColor(overallStats.averageProgress)}`}>
                    {overallStats.averageProgress}%
                  </p>
                  <div className="mt-2">
                    <Progress value={overallStats.averageProgress} className="w-full" />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Topics Completed</p>
                  <p className="text-3xl font-bold text-green-600">{overallStats.completedTopics}</p>
                  <p className="text-sm text-gray-500">out of {overallStats.totalTopics}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-3xl font-bold text-purple-600">{overallStats.totalSubjects}</p>
                  <p className="text-sm text-gray-500">active subjects</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance</p>
                  <p className="text-3xl font-bold text-orange-600">{overallStats.attendanceRate}%</p>
                  <p className="text-sm text-gray-500">this semester</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Subject-wise Progress
          </CardTitle>
          <CardDescription>
            Detailed progress breakdown for each subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {subjectProgress.map((subject) => (
              <div key={subject.subjectId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium text-lg">{subject.subjectName}</h3>
                    <Badge variant={getProgressBadgeVariant(subject.averageProgress)}>
                      {subject.averageProgress}%
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    Updated: {new Date(subject.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{subject.averageProgress}%</span>
                  </div>
                  <Progress value={subject.averageProgress} className="w-full" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="font-medium text-green-600">{subject.completedTopics}</p>
                    <p className="text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="font-medium text-blue-600">{subject.inProgressTopics}</p>
                    <p className="text-gray-600">In Progress</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-medium text-gray-600">{subject.totalTopics}</p>
                    <p className="text-gray-600">Total</p>
                  </div>
                </div>
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
          <CardDescription>
            Your learning milestones and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overallStats && overallStats.completedTopics >= 10 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Topic Master</span>
                </div>
                <p className="text-sm text-green-700">
                  Great job! You've completed 10+ topics.
                </p>
              </div>
            )}
            
            {overallStats && overallStats.averageProgress >= 80 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">High Achiever</span>
                </div>
                <p className="text-sm text-blue-700">
                  Excellent! You maintain 80%+ progress.
                </p>
              </div>
            )}
            
            {overallStats && overallStats.attendanceRate >= 95 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Perfect Attendance</span>
                </div>
                <p className="text-sm text-purple-700">
                  Amazing! You have 95%+ attendance.
                </p>
              </div>
            )}
            
            {overallStats && overallStats.totalSubjects >= 5 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Multi-Subject Learner</span>
                </div>
                <p className="text-sm text-orange-700">
                  Great! You're studying 5+ subjects.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Study Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Study Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Review completed topics regularly to reinforce learning</li>
            <li>• Focus on subjects with lower progress percentages</li>
            <li>• Ask your teachers for help with difficult topics</li>
            <li>• Create a study schedule to maintain consistent progress</li>
            <li>• Use the lesson topics as a guide for your studies</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProgressOverview;
