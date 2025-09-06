import { Suspense } from "react";
import MainDirectorDashboard from "./MainDirectorDashboard";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import Announcements from "@/components/Announcements";
import CountChartContainer from "@/components/CountChartContainer";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import FinanceChart from "@/components/FinanceChart";

const MainDirectorPage = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* DASHBOARD STATS */}
        <MainDirectorDashboard />

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

export default MainDirectorPage;
