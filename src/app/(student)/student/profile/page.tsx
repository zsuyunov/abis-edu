import { Suspense } from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import StudentProfileContainer from "@/components/StudentProfileContainer";

export const dynamic = 'force-dynamic';

const StudentProfilePage = async () => {
  const headersList = headers();
  const studentId = headersList.get("x-user-id");

  if (!studentId) {
    return <div>Unauthorized</div>;
  }

  // Fetch student data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: {
        include: {
          branch: true,
          academicYear: true
        }
      },
      branch: true
    }
  });

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student not found</h2>
          <p className="text-gray-600">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-3 flex flex-col gap-2">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            View and update your profile information
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded"></div>}>
          <StudentProfileContainer student={student} />
        </Suspense>
      </div>
    </div>
  );
};

export default StudentProfilePage;

