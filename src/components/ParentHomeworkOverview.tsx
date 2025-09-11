/*
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Homework, HomeworkAttachment, HomeworkSubmission, SubmissionAttachment } from '@prisma/client';
import { CheckCircle, Clock, XCircle, CircleDot, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { isPast } from 'date-fns';

interface HomeworkWithDetails extends Homework {
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  attachments: HomeworkAttachment[];
  submissions: (HomeworkSubmission & { attachments: SubmissionAttachment[] })[];
}

interface ClassStats {
  totalHomeworks: number;
  totalStudents: number;
  classAverageCompletionRate: number;
  childCompletionRate: number;
  childSubmittedCount: number;
}

interface ParentHomeworkOverviewProps {
  homeworks: HomeworkWithDetails[];
  classStats: ClassStats | null;
}

const ParentHomeworkOverview: React.FC<ParentHomeworkOverviewProps> = ({ homeworks, classStats }) => {
  if (homeworks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Homework Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No homework assignments to display.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  let submittedCount = 0;
  let lateCount = 0;
  let missedCount = 0;
  let pendingCount = 0;
  let gradedCount = 0;
  let totalGradePoints = 0;

  homeworks.forEach(hw => {
    const submission = hw.submissions[0];
    if (submission) {
      if (submission.status === 'GRADED' || submission.status === 'SUBMITTED') {
        submittedCount++;
        if (submission.isLate) lateCount++;
      } else if (submission.status === 'LATE') {
        submittedCount++;
        lateCount++;
      }
      
      if (submission.status === 'GRADED' && submission.grade !== null) {
        gradedCount++;
        totalGradePoints += submission.grade;
      }
    } else {
      if (isPast(hw.dueDate)) {
        missedCount++;
      } else {
        pendingCount++;
      }
    }
  });

  const totalHomeworks = homeworks.length;
  const completionRate = totalHomeworks > 0 ? (submittedCount / totalHomeworks) * 100 : 0;
  const onTimeRate = submittedCount > 0 ? ((submittedCount - lateCount) / submittedCount) * 100 : 0;
  const averageGrade = gradedCount > 0 ? totalGradePoints / gradedCount : null;

  // Subject-wise breakdown
  const subjectStats: { [key: string]: { total: number; submitted: number; } } = {};
  homeworks.forEach(hw => {
    const subjectName = hw.subject.name;
    if (!subjectStats[subjectName]) {
      subjectStats[subjectName] = { total: 0, submitted: 0 };
    }
    subjectStats[subjectName].total++;
    if (hw.submissions[0] && (hw.submissions[0].status === 'GRADED' || hw.submissions[0].status === 'SUBMITTED' || hw.submissions[0].status === 'LATE')) {
      subjectStats[subjectName].submitted++;
    }
  });

  // Performance comparison with class average
  const performanceComparison = classStats ? 
    (classStats.childCompletionRate - classStats.classAverageCompletionRate) : 0;

  const getPerformanceIcon = () => {
    if (performanceComparison > 5) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (performanceComparison < -5) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-yellow-500" />;
  };

  const getPerformanceText = () => {
    if (performanceComparison > 5) return 'Above Class Average';
    if (performanceComparison < -5) return 'Below Class Average';
    return 'Near Class Average';
  };

  const getPerformanceColor = () => {
    if (performanceComparison > 5) return 'text-green-600';
    if (performanceComparison < -5) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Homework Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Statistics }
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-md bg-blue-50">
            <div className="flex items-center justify-center mb-2">
              <CircleDot className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalHomeworks}</p>
            <p className="text-sm text-blue-600">Total Assigned</p>
          </div>
          <div className="text-center p-4 border rounded-md bg-green-50">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-700">{submittedCount}</p>
            <p className="text-sm text-green-600">Submitted</p>
          </div>
          <div className="text-center p-4 border rounded-md bg-yellow-50">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">{lateCount}</p>
            <p className="text-sm text-yellow-600">Late</p>
          </div>
          <div className="text-center p-4 border rounded-md bg-red-50">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-700">{missedCount}</p>
            <p className="text-sm text-red-600">Missed</p>
          </div>
        </div>

        {/* Progress Bars }
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Completion Rate</span>
              <span className="text-sm text-gray-600">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">On-Time Submission Rate</span>
              <span className="text-sm text-gray-600">{onTimeRate.toFixed(1)}%</span>
            </div>
            <Progress value={onTimeRate} className="h-3" />
          </div>
        </div>

        {/* Class Comparison }
        {classStats && (
          <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="font-semibold mb-3">Class Performance Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Your Child</p>
                <p className="text-xl font-bold text-blue-600">{classStats.childCompletionRate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Class Average</p>
                <p className="text-xl font-bold text-gray-600">{classStats.classAverageCompletionRate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {getPerformanceIcon()}
                  <p className={`text-sm font-medium ${getPerformanceColor()}`}>
                    {getPerformanceText()}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {performanceComparison > 0 ? '+' : ''}{performanceComparison.toFixed(1)}% difference
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Average Grade }
        {averageGrade !== null && (
          <div className="p-4 border rounded-md bg-purple-50">
            <h3 className="font-semibold mb-2">Academic Performance</h3>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-purple-600">Average Grade</p>
                <p className="text-2xl font-bold text-purple-700">{averageGrade.toFixed(1)}/100</p>
              </div>
              <div>
                <p className="text-sm text-purple-600">Graded Assignments</p>
                <p className="text-lg font-semibold text-purple-700">{gradedCount} of {submittedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subject-wise Breakdown }
        <div>
          <h3 className="font-semibold mb-3">Subject-wise Progress</h3>
          <div className="space-y-3">
            {Object.entries(subjectStats).map(([subject, stats]) => {
              const subjectCompletionRate = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0;
              return (
                <div key={subject} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{subject}</span>
                    <Badge variant="secondary">{stats.submitted}/{stats.total}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{subjectCompletionRate.toFixed(0)}%</span>
                    <div className="w-20">
                      <Progress value={subjectCompletionRate} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Assignments Alert }
        {pendingCount > 0 && (
          <div className="p-4 border border-orange-200 rounded-md bg-orange-50">
            <p className="text-sm text-orange-700">
              <strong>Attention:</strong> Your child has {pendingCount} pending homework assignment{pendingCount > 1 ? 's' : ''} 
              that need{pendingCount === 1 ? 's' : ''} to be completed before the deadline.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParentHomeworkOverview;


*/