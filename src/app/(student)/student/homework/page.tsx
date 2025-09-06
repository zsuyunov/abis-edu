import { Suspense } from "react";
import { headers } from "next/headers";
import StudentHomeworkContainer from "@/components/StudentHomeworkContainer";

const StudentHomeworkPage = async () => {
  const headersList = headers();
  const studentId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Homework</h1>
          <p className="text-sm text-gray-600 mt-1">
            View assignments, submit work, and track your progress
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
          <StudentHomeworkContainer studentId={studentId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default StudentHomeworkPage;
