import { Suspense } from "react";
import { headers } from "next/headers";
import ParentAttendanceContainer from "@/components/ParentAttendanceContainer";

const ParentAttendancePage = async () => {
  const headersList = headers();
  const parentId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Children&apos;s Attendance</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor your children&apos;s attendance, view analytics, and track their academic progress
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
          <ParentAttendanceContainer parentId={parentId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default ParentAttendancePage;
