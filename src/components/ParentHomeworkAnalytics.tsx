/*
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Homework, HomeworkAttachment, HomeworkSubmission, SubmissionAttachment } from '@prisma/client';
import { isPast, startOfWeek, endOfWeek, format, eachWeekOfInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

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

interface ParentHomeworkAnalyticsProps {
  homeworks: HomeworkWithDetails[];
  classStats: ClassStats | null;
}

const ParentHomeworkAnalytics: React.FC<ParentHomeworkAnalyticsProps> = ({ homeworks, classStats }) => {
  if (homeworks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Homework Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No homework data available for analytics.</p>
        </CardContent>
      </Card>
    );
  }

  // Subject-wise completion rate
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

  const subjectLabels = Object.keys(subjectStats);
  const subjectCompletionRates = subjectLabels.map(
    label => subjectStats[label].total > 0 ? (subjectStats[label].submitted / subjectStats[label].total) * 100 : 0
  );

  // Subject completion bar chart
  const subjectCompletionData = {
    labels: subjectLabels,
    datasets: [
      {
        label: 'Child Completion %',
        data: subjectCompletionRates,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Timeline of homework completion (weekly)
  const timelineData: { [key: string]: { assigned: number; completed: number; } } = {};
  const earliestDate = homeworks.reduce((earliest, hw) => 
    new Date(hw.assignedDate) < earliest ? new Date(hw.assignedDate) : earliest, 
    new Date()
  );
  const latestDate = new Date();

  // Group homework by week
  const weeks = eachWeekOfInterval({ start: earliestDate, end: latestDate });
  weeks.forEach(week => {
    const weekKey = format(week, 'MMM dd');
    timelineData[weekKey] = { assigned: 0, completed: 0 };
  });

  homeworks.forEach(hw => {
    const assignedWeek = startOfWeek(new Date(hw.assignedDate));
    const weekKey = format(assignedWeek, 'MMM dd');
    if (timelineData[weekKey]) {
      timelineData[weekKey].assigned++;
      if (hw.submissions[0] && (hw.submissions[0].status === 'GRADED' || hw.submissions[0].status === 'SUBMITTED' || hw.submissions[0].status === 'LATE')) {
        timelineData[weekKey].completed++;
      }
    }
  });

  const timelineLabels = Object.keys(timelineData);
  const timelineCompletionRates = timelineLabels.map(week => 
    timelineData[week].assigned > 0 ? (timelineData[week].completed / timelineData[week].assigned) * 100 : 0
  );

  // Timeline completion line chart
  const timelineCompletionData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Weekly Completion Rate (%)',
        data: timelineCompletionRates,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Overall submission status distribution
  let submittedCount = 0;
  let lateCount = 0;
  let missedCount = 0;
  let pendingCount = 0;

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
    } else {
      if (isPast(hw.dueDate)) {
        missedCount++;
      } else {
        pendingCount++;
      }
    }
  });

  const statusDistributionData = {
    labels: ['Submitted On Time', 'Submitted Late', 'Missed', 'Pending'],
    datasets: [
      {
        data: [submittedCount - lateCount, lateCount, missedCount, pendingCount],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Class comparison data
  let classComparisonData = null;
  if (classStats) {
    classComparisonData = {
      labels: ['Your Child', 'Class Average'],
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: [classStats.childCompletionRate, classStats.classAverageCompletionRate],
          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(156, 163, 175, 0.8)'],
          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(156, 163, 175, 1)'],
          borderWidth: 1,
        },
      ],
    };
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Homework Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Subject-wise Performance }
        <div>
          <h3 className="text-lg font-semibold mb-4">Subject-wise Completion Rate</h3>
          <div className="h-64">
            <Bar data={subjectCompletionData} options={chartOptions} />
          </div>
        </div>

        {/* Timeline Progress }
        <div>
          <h3 className="text-lg font-semibold mb-4">Homework Completion Timeline</h3>
          <div className="h-64">
            <Line data={timelineCompletionData} options={chartOptions} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Status Distribution }
          <div>
            <h3 className="text-lg font-semibold mb-4">Submission Status Distribution</h3>
            <div className="h-64">
              <Pie data={statusDistributionData} options={pieChartOptions} />
            </div>
          </div>

          {/* Class Comparison }
          {classComparisonData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Class Performance Comparison</h3>
              <div className="h-64">
                <Bar data={classComparisonData} options={chartOptions} />
              </div>
              <div className="mt-3 p-3 bg-gray-50 border rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Your child's performance:</strong> {' '}
                  {classStats.childCompletionRate > classStats.classAverageCompletionRate 
                    ? `${(classStats.childCompletionRate - classStats.classAverageCompletionRate).toFixed(1)}% above class average` 
                    : classStats.childCompletionRate < classStats.classAverageCompletionRate
                    ? `${(classStats.classAverageCompletionRate - classStats.childCompletionRate).toFixed(1)}% below class average`
                    : 'matches class average'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Key Insights }
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                <strong>Best Subject:</strong> {' '}
                {subjectLabels.length > 0 
                  ? subjectLabels[subjectCompletionRates.indexOf(Math.max(...subjectCompletionRates))]
                  : 'N/A'
                } ({Math.max(...subjectCompletionRates).toFixed(0)}%)
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                <strong>Needs Attention:</strong> {' '}
                {subjectLabels.length > 0 
                  ? subjectLabels[subjectCompletionRates.indexOf(Math.min(...subjectCompletionRates))]
                  : 'N/A'
                } ({Math.min(...subjectCompletionRates).toFixed(0)}%)
              </p>
            </div>
            {classStats && (
              <>
                <div>
                  <p className="text-blue-700">
                    <strong>Overall Completion:</strong> {classStats.childCompletionRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">
                    <strong>On-time Rate:</strong> {' '}
                    {submittedCount > 0 ? (((submittedCount - lateCount) / submittedCount) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParentHomeworkAnalytics;

*/