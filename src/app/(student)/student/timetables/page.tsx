import { Suspense } from "react";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
import StudentTimetableContainer from "@/components/StudentTimetableContainer";

const StudentTimetablesPage = async () => {
  const headersList = headers();
  const studentId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-2 sm:p-3 flex flex-col gap-2">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base sm:text-lg font-semibold">My Class Timetable</h1>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded"></div>}>
          <StudentTimetableContainer studentId={studentId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default StudentTimetablesPage;
