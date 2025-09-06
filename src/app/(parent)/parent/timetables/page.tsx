import { Suspense } from "react";
import { headers } from "next/headers";
import ParentTimetableContainer from "@/components/ParentTimetableContainer";

const ParentTimetablesPage = async () => {
  const headersList = headers();
  const parentId = headersList.get("x-user-id");

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold">Children&apos;s Timetables</h1>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
          <ParentTimetableContainer parentId={parentId!} />
        </Suspense>
      </div>
    </div>
  );
};

export default ParentTimetablesPage;
