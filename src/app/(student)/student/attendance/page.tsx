import { Suspense } from "react";
import { headers } from "next/headers";
import StudentAttendanceContainer from "@/components/StudentAttendanceContainer";

export const dynamic = 'force-dynamic';

const StudentAttendancePage = async () => {
  const headersList = headers();
  const studentId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-2 sm:p-3 flex flex-col gap-2">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">My Attendance</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            View your attendance records and track your progress
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded"></div>}>
          <StudentAttendanceContainer studentId={studentId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
