"use client";

import { useEffect, useState } from "react";
import UserCardClient from "@/components/UserCardClient";
import CountChart from "@/components/CountChart";
import AttendanceChart from "@/components/AttendanceChart";
import FinanceChart from "@/components/FinanceChart";
import EventCalendar from "@/components/EventCalendar";
import AnnouncementsClient from "@/components/AnnouncementsClient";

const SupportHRDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/support-hr/dashboard");
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex gap-4 flex-col md:flex-row">
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          <div className="flex gap-4 justify-between flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-4 rounded-md flex-1 min-w-[130px]">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
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
          <UserCardClient 
            type="teacher" 
            count={dashboardData?.teacherCount || 0}
            subtitle="Teachers (My Branch)"
          />
          <UserCardClient 
            type="student" 
            count={dashboardData?.studentCount || 0}
            subtitle="Students (My Branch)"
          />
          <UserCardClient 
            type="parent" 
            count={dashboardData?.parentCount || 0}
            subtitle="Parents (My Branch)"
          />
          <UserCardClient 
            type="staff" 
            count={dashboardData?.staffCount || 0}
            subtitle="Staff (My Branch)"
          />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChart boys={dashboardData?.boysCount || 0} girls={dashboardData?.girlsCount || 0} />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart data={dashboardData?.attendanceData || []} />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <AnnouncementsClient />
      </div>
    </div>
  );
};

export default SupportHRDashboard;
