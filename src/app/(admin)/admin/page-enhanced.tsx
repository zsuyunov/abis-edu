"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import CountCard from "@/components/dashboard/CountCard";
import { useDashboard } from "@/hooks/useDashboard";

// Lazy load heavy components for better performance
const EventCalendarContainer = dynamic(() => import("@/components/EventCalendarContainer"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-[400px] rounded-lg"></div>,
  ssr: false
});

const Announcements = dynamic(() => import("@/components/Announcements"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-[300px] rounded-lg"></div>,
  ssr: false
});

const CountChartContainer = dynamic(() => import("@/components/CountChartContainer"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>,
  ssr: false
});

const AttendanceChartContainer = dynamic(() => import("@/components/AttendanceChartContainer"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>,
  ssr: false
});

const FinanceChart = dynamic(() => import("@/components/FinanceChart"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-[500px] rounded-lg"></div>,
  ssr: false
});

// Loading skeleton for count cards
const CountCardSkeleton = () => (
  <div className="animate-pulse bg-gray-200 rounded-2xl p-4 flex-1 min-w-[130px] h-[120px]"></div>
);

const AdminPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const { data: stats, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="p-4 flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Error loading dashboard</p>
          <p className="text-gray-600">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
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
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Classes</h3>
            <p className="text-2xl font-bold text-blue-600">{stats?.classes || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Subjects</h3>
            <p className="text-2xl font-bold text-green-600">{stats?.subjects || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Events</h3>
            <p className="text-2xl font-bold text-purple-600">{stats?.events || 0}</p>
          </div>
        </div>

        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>}>
              <CountChartContainer />
            </Suspense>
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>}>
              <AttendanceChartContainer />
            </Suspense>
          </div>
        </div>

        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[500px] rounded-lg"></div>}>
            <FinanceChart />
          </Suspense>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[400px] rounded-lg"></div>}>
          <EventCalendarContainer searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[300px] rounded-lg"></div>}>
          <Announcements />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminPage;
