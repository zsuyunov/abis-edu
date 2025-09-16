"use client";

import CountCard from "@/components/dashboard/CountCard";
import { useDashboard } from "@/hooks/useDashboard";

// Loading skeleton for count cards
const CountCardSkeleton = () => (
  <div className="animate-pulse bg-gray-200 rounded-2xl p-4 flex-1 min-w-[130px] h-[120px]"></div>
);

const AdminDashboard = () => {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-white/90 mb-3 drop-shadow-md">Total Classes</h3>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {isLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                stats?.classes || 0
              )}
            </p>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-white/90 mb-3 drop-shadow-md">Total Subjects</h3>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {isLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                stats?.subjects || 0
              )}
            </p>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-white/90 mb-3 drop-shadow-md">Upcoming Events</h3>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {isLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
              ) : (
                stats?.events || 0
              )}
            </p>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
