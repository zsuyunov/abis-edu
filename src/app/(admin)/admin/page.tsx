import { Suspense } from "react";
import ModernAdminDashboard from "@/components/ModernAdminDashboard";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import Announcements from "@/components/Announcements";
import CountChartContainer from "@/components/CountChartContainer";
import TeacherCountChartContainer from "@/components/TeacherCountChartContainer";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";

const AdminPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* MODERN DASHBOARD STATS */}
        <ModernAdminDashboard />

        {/* CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* STUDENTS COUNT CHART */}
          <div className="w-full lg:w-1/2 h-[450px]">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>}>
              <CountChartContainer />
            </Suspense>
          </div>
          {/* TEACHERS COUNT CHART */}
          <div className="w-full lg:w-1/2 h-[450px]">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>}>
              <TeacherCountChartContainer />
            </Suspense>
          </div>
        </div>

        {/* Quick Stats - Moved below charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-sky-500 to-sky-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-white/90 text-sm font-medium mb-1">Active Classes</h3>
                  <p className="text-3xl font-bold text-white">26</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-white/90 text-sm font-medium mb-1">Total Subjects</h3>
                  <p className="text-3xl font-bold text-white">61</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-white/90 text-sm font-medium mb-1">Upcoming Events</h3>
                  <p className="text-3xl font-bold text-white">0</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* ATTENDANCE CHART - Moved below stats */}
        <div className="w-full h-[450px]">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-[450px] rounded-lg"></div>}>
            <AttendanceChartContainer />
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
