import { Suspense } from "react";
import { headers } from "next/headers";
import TeacherGradebookContainer from "@/components/TeacherGradebookContainer";

const TeacherGradebookPage = async () => {
  const headersList = headers();
  const teacherId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Grades & Exam Results</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage grades and exam results for your assigned classes and subjects
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
          <TeacherGradebookContainer teacherId={teacherId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default TeacherGradebookPage;
