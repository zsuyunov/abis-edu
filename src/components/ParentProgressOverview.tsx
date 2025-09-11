/*
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
  Calendar,
  User,
  AlertCircle,
  Star
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

interface ParentProgressOverviewProps {
  childId: string;
  academicYearId: number;
  childName: string;
}

const ParentProgressOverview = ({ childId, academicYearId, childName }: ParentProgressOverviewProps) => {
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [childId, academicYearId]);

  const fetchProgressData = async () => {
    try {
      const response = await fetch(`/api/parent/progress?childId=${childId}&academicYearId=${academicYearId}`, {
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
      {/* Header }
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{childName}'s Progress</h2>
          <p className="text-gray-600">Track learning progress and achievements</p>
        </div>
        <Button variant="outline" size="sm" className="shadow-sm">
          <Calendar className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>

      {/* Overall Stats }
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Overall Progress</p>
                  <p className="text-3xl font-bold">{overallStats.averageProgress}%</p>
                  <div className="mt-2">
                    <Progress value={overallStats.averageProgress} className="w-full bg-blue-200" />
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Topics Completed</p>
                  <p className="text-3xl font-bold">{overallStats.completedTopics}</p>
                  <p className="text-sm text-green-200">out of {overallStats.totalTopics}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Subjects</p>
                  <p className="text-3xl font-bold">{overallStats.totalSubjects}</p>
                  <p className="text-sm text-purple-200">active subjects</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Attendance</p>
                  <p className="text-3xl font-bold">{overallStats.attendanceRate}%</p>
                  <p className="text-sm text-orange-200">this semester</p>
                </div>
                <Target className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Progress }
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
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
              <div key={subject.subjectId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{subject.subjectName}</h3>
                      <p className="text-sm text-gray-600">Last updated: {new Date(subject.lastUpdated).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={getProgressBadgeVariant(subject.averageProgress)} className="text-sm">
                      {subject.averageProgress}%
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">Overall Progress</span>
                    <span className="font-bold text-blue-600">{subject.averageProgress}%</span>
                  </div>
                  <Progress value={subject.averageProgress} className="w-full h-3" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{subject.completedTopics}</p>
                    <p className="text-sm text-green-700 font-medium">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">{subject.inProgressTopics}</p>
                    <p className="text-sm text-blue-700 font-medium">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-2xl font-bold text-gray-600">{subject.totalTopics}</p>
                    <p className="text-sm text-gray-700 font-medium">Total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements }
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5" />
            Achievements & Milestones
          </CardTitle>
          <CardDescription>
            {childName}'s learning achievements and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overallStats && overallStats.completedTopics >= 10 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-green-600" />
                  <span className="font-semibold text-green-800">Topic Master</span>
                </div>
                <p className="text-sm text-green-700">
                  Great job! {childName} has completed 10+ topics.
                </p>
              </div>
            )}
            
            {overallStats && overallStats.averageProgress >= 80 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold text-blue-800">High Achiever</span>
                </div>
                <p className="text-sm text-blue-700">
                  Excellent! {childName} maintains 80%+ progress.
                </p>
              </div>
            )}
            
            {overallStats && overallStats.attendanceRate >= 95 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  <span className="font-semibold text-purple-800">Perfect Attendance</span>
                </div>
                <p className="text-sm text-purple-700">
                  Amazing! {childName} has 95%+ attendance.
                </p>
              </div>
            )}
            
            {overallStats && overallStats.totalSubjects >= 5 && (
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                  <span className="font-semibold text-orange-800">Multi-Subject Learner</span>
                </div>
                <p className="text-sm text-orange-700">
                  Great! {childName} is studying 5+ subjects.
                </p>
              </div>
            )}

            {overallStats && overallStats.completedTopics >= 50 && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-6 h-6 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Learning Star</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Outstanding! {childName} has completed 50+ topics.
                </p>
              </div>
            )}

            {overallStats && overallStats.averageProgress >= 90 && (
              <div className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border border-pink-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-pink-600" />
                  <span className="font-semibold text-pink-800">Excellence</span>
                </div>
                <p className="text-sm text-pink-700">
                  Outstanding! {childName} maintains 90%+ progress.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parent Tips }
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5" />
            Parent Tips for {childName}
          </h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Review completed topics with {childName} to reinforce learning</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Focus on subjects with lower progress percentages for extra support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Celebrate achievements and milestones to motivate continued learning</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Use the progress data to identify areas where {childName} might need help</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Communicate with teachers about any concerns or questions</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Areas for Improvement }
      {subjectProgress.some(subject => subject.averageProgress < 60) && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
          <CardContent className="p-6">
            <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {subjectProgress
                .filter(subject => subject.averageProgress < 60)
                .map(subject => (
                  <div key={subject.subjectId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <span className="font-medium text-yellow-800">{subject.subjectName}</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      {subject.averageProgress}% progress
                    </Badge>
                  </div>
                ))}
            </div>
            <p className="text-sm text-yellow-700 mt-3">
              Consider providing extra support or discussing these subjects with {childName}'s teachers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentProgressOverview;


*/