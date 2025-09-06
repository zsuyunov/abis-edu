import { Suspense } from "react";
import { headers } from "next/headers";
import TeacherAttendanceContainer from "@/components/TeacherAttendanceContainer";

const TeacherAttendancePage = async () => {
  const headersList = headers();
  const teacherId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Attendance Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Take attendance, view history, and manage student attendance records
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
          <TeacherAttendanceContainer teacherId={teacherId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
