'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, CheckCircle, Clock, TrendingDown, TrendingUp, Award } from 'lucide-react';
import { Homework, HomeworkAttachment, HomeworkSubmission, SubmissionAttachment } from '@prisma/client';
import { isPast, isFuture, differenceInDays, format } from 'date-fns';

interface HomeworkWithDetails extends Homework {
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  attachments: HomeworkAttachment[];
  submissions: (HomeworkSubmission & { attachments: SubmissionAttachment[] })[];
}

interface ParentHomeworkAlertsProps {
  homeworks: HomeworkWithDetails[];
  childName: string;
}

const ParentHomeworkAlerts: React.FC<ParentHomeworkAlertsProps> = ({ homeworks, childName }) => {
  const alerts: {
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    icon: React.ReactNode;
  }[] = [];

  const achievements: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [];

  if (homeworks.length === 0) {
    alerts.push({
      type: 'info',
      title: 'No Homework Data',
      message: 'No homework assignments found for the selected criteria.',
      icon: <Bell className="h-5 w-5" />,
    });
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>{alerts[0].message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate various metrics for alerts
  let submittedCount = 0;
  let lateCount = 0;
  let missedCount = 0;
  let pendingCount = 0;
  let gradedCount = 0;
  let totalGradePoints = 0;
  let perfectScores = 0;
  let consecutiveOnTime = 0;
  let lastSubmissionWasOnTime = true;

  const upcomingDeadlines: HomeworkWithDetails[] = [];
  const recentlyGraded: HomeworkWithDetails[] = [];
  const lowPerformanceSubjects: { subject: string; rate: number }[] = [];

  // Subject-wise performance tracking
  const subjectPerformance: { [key: string]: { total: number; submitted: number; grades: number[] } } = {};

  // Analyze each homework
  homeworks.forEach(hw => {
    const submission = hw.submissions[0];
    const subjectName = hw.subject.name;

    // Initialize subject tracking
    if (!subjectPerformance[subjectName]) {
      subjectPerformance[subjectName] = { total: 0, submitted: 0, grades: [] };
    }
    subjectPerformance[subjectName].total++;

    // Check submission status
    if (submission) {
      if (submission.status === 'GRADED' || submission.status === 'SUBMITTED') {
        submittedCount++;
        subjectPerformance[subjectName].submitted++;
        
        if (!submission.isLate) {
          if (lastSubmissionWasOnTime) {
            consecutiveOnTime++;
          } else {
            consecutiveOnTime = 1;
            lastSubmissionWasOnTime = true;
          }
        } else {
          lateCount++;
          lastSubmissionWasOnTime = false;
          consecutiveOnTime = 0;
        }
      } else if (submission.status === 'LATE') {
        submittedCount++;
        lateCount++;
        subjectPerformance[subjectName].submitted++;
        lastSubmissionWasOnTime = false;
        consecutiveOnTime = 0;
      }

      // Check grades
      if (submission.status === 'GRADED' && submission.grade !== null) {
        gradedCount++;
        totalGradePoints += submission.grade;
        subjectPerformance[subjectName].grades.push(submission.grade);
        
        // Check for perfect scores
        if (hw.totalPoints && submission.grade === hw.totalPoints) {
          perfectScores++;
        }

        // Recently graded (within last 7 days)
        if (submission.submissionDate && differenceInDays(new Date(), submission.submissionDate) <= 7) {
          recentlyGraded.push(hw);
        }
      }
    } else {
      // No submission
      if (isPast(hw.dueDate)) {
        missedCount++;
      } else {
        pendingCount++;
        // Check for upcoming deadlines (within 3 days)
        if (isFuture(hw.dueDate) && differenceInDays(hw.dueDate, new Date()) <= 3) {
          upcomingDeadlines.push(hw);
        }
      }
    }
  });

  // Calculate rates and averages
  const totalHomeworks = homeworks.length;
  const completionRate = totalHomeworks > 0 ? (submittedCount / totalHomeworks) * 100 : 0;
  const onTimeRate = submittedCount > 0 ? ((submittedCount - lateCount) / submittedCount) * 100 : 0;
  const averageGrade = gradedCount > 0 ? totalGradePoints / gradedCount : null;

  // Identify low-performance subjects
  Object.entries(subjectPerformance).forEach(([subject, data]) => {
    const subjectCompletionRate = data.total > 0 ? (data.submitted / data.total) * 100 : 0;
    if (subjectCompletionRate < 70 && data.total >= 3) {
      lowPerformanceSubjects.push({ subject, rate: subjectCompletionRate });
    }
  });

  // Generate alerts based on analysis
  if (upcomingDeadlines.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Upcoming Deadlines',
      message: `${childName} has ${upcomingDeadlines.length} homework assignment${upcomingDeadlines.length > 1 ? 's' : ''} due soon: ${upcomingDeadlines.map(hw => hw.title).join(', ')}.`,
      icon: <Clock className="h-5 w-5" />,
    });
  }

  if (missedCount > 0) {
    alerts.push({
      type: 'error',
      title: 'Missed Assignments',
      message: `${childName} has missed ${missedCount} homework assignment${missedCount > 1 ? 's' : ''}. Please check with teachers about makeup opportunities.`,
      icon: <AlertTriangle className="h-5 w-5" />,
    });
  }

  if (lateCount >= 3 && totalHomeworks >= 5) {
    alerts.push({
      type: 'warning',
      title: 'Late Submissions Pattern',
      message: `${childName} has submitted ${lateCount} assignments late. Consider reviewing time management strategies.`,
      icon: <Clock className="h-5 w-5" />,
    });
  }

  if (completionRate < 60 && totalHomeworks >= 5) {
    alerts.push({
      type: 'error',
      title: 'Low Completion Rate',
      message: `${childName}'s homework completion rate is ${completionRate.toFixed(1)}%. This needs immediate attention.`,
      icon: <TrendingDown className="h-5 w-5" />,
    });
  }

  if (lowPerformanceSubjects.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Subject Performance Concern',
      message: `${childName} needs support in: ${lowPerformanceSubjects.map(s => s.subject).join(', ')}. Consider additional help or tutoring.`,
      icon: <TrendingDown className="h-5 w-5" />,
    });
  }

  if (averageGrade !== null && averageGrade < 60) {
    alerts.push({
      type: 'warning',
      title: 'Academic Performance',
      message: `${childName}'s average grade is ${averageGrade.toFixed(1)}/100. Extra support may be needed.`,
      icon: <TrendingDown className="h-5 w-5" />,
    });
  }

  // Generate achievements
  if (completionRate >= 90 && totalHomeworks >= 5) {
    achievements.push({
      title: 'Homework Champion',
      description: `${completionRate.toFixed(1)}% completion rate - Excellent work!`,
      icon: <Award className="h-6 w-6 text-yellow-500" />,
    });
  }

  if (onTimeRate >= 95 && submittedCount >= 5) {
    achievements.push({
      title: 'Punctuality Star',
      description: `${onTimeRate.toFixed(1)}% on-time submissions - Great time management!`,
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    });
  }

  if (consecutiveOnTime >= 5) {
    achievements.push({
      title: 'Consistency Master',
      description: `${consecutiveOnTime} consecutive on-time submissions!`,
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
    });
  }

  if (perfectScores > 0) {
    achievements.push({
      title: 'Perfect Scorer',
      description: `Achieved perfect scores on ${perfectScores} assignment${perfectScores > 1 ? 's' : ''}!`,
      icon: <Award className="h-6 w-6 text-purple-500" />,
    });
  }

  if (averageGrade !== null && averageGrade >= 85) {
    achievements.push({
      title: 'Academic Excellence',
      description: `Maintaining an average grade of ${averageGrade.toFixed(1)}/100!`,
      icon: <Award className="h-6 w-6 text-green-500" />,
    });
  }

  // Positive alerts
  if (recentlyGraded.length > 0 && alerts.filter(a => a.type === 'success').length === 0) {
    const goodGrades = recentlyGraded.filter(hw => 
      hw.submissions[0] && hw.submissions[0].grade !== null && hw.submissions[0].grade >= 80
    );
    
    if (goodGrades.length > 0) {
      alerts.push({
        type: 'success',
        title: 'Recent Good Performance',
        message: `${childName} received good grades on recent assignments: ${goodGrades.map(hw => hw.title).slice(0, 2).join(', ')}${goodGrades.length > 2 ? ` and ${goodGrades.length - 2} more` : ''}.`,
        icon: <CheckCircle className="h-5 w-5" />,
      });
    }
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Achievements Section */}
        {achievements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-700">🎉 Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center p-3 border border-green-200 rounded-md bg-green-50">
                  {achievement.icon}
                  <div className="ml-3">
                    <p className="font-semibold text-green-800">{achievement.title}</p>
                    <p className="text-sm text-green-700">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📢 Important Notifications</h3>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Alert key={index} className={getAlertStyles(alert.type)}>
                  <div className="flex items-start gap-3">
                    {alert.icon}
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great news! {childName} is doing well with homework. No immediate concerns to report.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quick Summary */}
        <div className="p-4 border rounded-md bg-gray-50">
          <h3 className="font-semibold mb-2">Quick Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-lg font-bold text-blue-600">{completionRate.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">On-Time Rate</p>
              <p className="text-lg font-bold text-green-600">{onTimeRate.toFixed(1)}%</p>
            </div>
            {averageGrade !== null && (
              <div className="text-center">
                <p className="text-sm text-gray-600">Average Grade</p>
                <p className="text-lg font-bold text-purple-600">{averageGrade.toFixed(1)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-bold text-orange-600">{pendingCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParentHomeworkAlerts;
