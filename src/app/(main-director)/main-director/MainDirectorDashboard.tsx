"use client";

import CountCard from "@/components/dashboard/CountCard";
import { useDashboard } from "@/hooks/useDashboard";

// Loading skeleton for count cards
const CountCardSkeleton = () => (
  <div className="animate-pulse bg-gray-200 rounded-2xl p-4 flex-1 min-w-[130px] h-[120px]"></div>
);

const MainDirectorDashboard = () => {
  const { data: stats, isLoading, error } = useDashboard();

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
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold mb-2">📊 Main Director Dashboard</h1>
        <p className="text-purple-100">Comprehensive overview of all school operations (Read-Only Access)</p>
      </div>

      {/* USER CARDS */}
      <div className="flex gap-4 justify-between flex-wrap">
        {isLoading ? (
          <>
            <CountCardSkeleton />
            <CountCardSkeleton />
            <CountCardSkeleton />
            <CountCardSkeleton />
          </>
        ) : (
          <>
            <CountCard 
              type="admin" 
              count={stats?.admins.count || 0} 
              date="2024/25"
              trend={stats?.admins.trend}
              percentage={stats?.admins.percentage}
            />
            <CountCard 
              type="teacher" 
              count={stats?.teachers.count || 0} 
              date="2024/25"
              trend={stats?.teachers.trend}
              percentage={stats?.teachers.percentage}
            />
            <CountCard 
              type="student" 
              count={stats?.students.count || 0} 
              date="2024/25"
              trend={stats?.students.trend}
              percentage={stats?.students.percentage}
            />
            <CountCard 
              type="parent" 
              count={stats?.parents.count || 0} 
              date="2024/25"
              trend={stats?.parents.trend}
              percentage={stats?.parents.percentage}
            />
          </>
        )}
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Classes</h3>
          <p className="text-2xl font-bold text-purple-600">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats?.classes || 0
            )}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Subjects</h3>
          <p className="text-2xl font-bold text-purple-600">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats?.subjects || 0
            )}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Events</h3>
          <p className="text-2xl font-bold text-purple-600">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
            ) : (
              stats?.events || 0
            )}
          </p>
        </div>
      </div>
    </>
  );
};

export default MainDirectorDashboard;
