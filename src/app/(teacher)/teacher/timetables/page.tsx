import { Suspense } from "react";
import { headers } from "next/headers";
import TeacherTimetableContainer from "@/components/TeacherTimetableContainer";

const TeacherTimetablesPage = async () => {
  const headersList = headers();
  const teacherId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Timetables</h1>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
          <TeacherTimetableContainer teacherId={teacherId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default TeacherTimetablesPage;
