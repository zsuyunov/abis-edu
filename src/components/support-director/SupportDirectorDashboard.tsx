"use client";

import { useQuery } from "@tanstack/react-query";
import CountCard from "@/components/dashboard/CountCard";

type SDStats = {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalSubjects: number;
  upcomingExams: number;
  pendingHomework: number;
};

const CountCardSkeleton = (
  <div className="flex-1 min-w-[200px] h-[100px] bg-gray-100 rounded-lg animate-pulse"></div>
);

export default function SupportDirectorDashboard() {
  const { data: stats, isLoading, error } = useQuery<SDStats>({
    queryKey: ["support-director-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/support-director/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    return (
      <div className="p-4 flex items-center justify-center h-[200px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Error loading dashboard stats</p>
          <p className="text-gray-600">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* USER CARDS */}
      <div className="flex gap-4 justify-between flex-wrap">
        {isLoading ? (
          <>
            {CountCardSkeleton}
            {CountCardSkeleton}
            {CountCardSkeleton}
            {CountCardSkeleton}
          </>
        ) : (
          <>
            <CountCard type="student" count={stats?.totalStudents || 0} date="2024/25" />
            <CountCard type="teacher" count={stats?.totalTeachers || 0} date="2024/25" />
            <CountCard type="parent" count={stats?.totalParents || 0} date="2024/25" />
            <CountCard type="class" count={stats?.totalClasses || 0} date="2024/25" />
          </>
        )}
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Subjects</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.totalSubjects ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Exams</h3>
          <p className="text-2xl font-bold text-purple-600">{stats?.upcomingExams ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Homework</h3>
          <p className="text-2xl font-bold text-orange-600">{stats?.pendingHomework ?? 0}</p>
        </div>
      </div>
    </>
  );
}


