import { Suspense } from "react";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
import TeacherTimetableContainer from "@/components/TeacherTimetableContainer";
import prisma from "@/lib/prisma";

const TeacherTimetablesPage = async () => {
  const headersList = headers();
  const teacherId = headersList.get("x-user-id");

  // Fetch teacher information with assigned branches, classes, subjects via TeacherAssignment
  const teacherData = await prisma.teacher.findUnique({
    where: { id: teacherId! },
    include: {
      TeacherAssignment: {
        include: {
          Branch: true,
          Class: {
            include: {
              branch: true,
              academicYear: true,
            },
          },
          Subject: true,
          AcademicYear: true,
        },
      },
    },
  });

  // Separate regular assignments from supervisor assignments
  const regularAssignments = teacherData?.TeacherAssignment?.filter((a) => a.role === "TEACHER") || [];
  const supervisorAssignments = teacherData?.TeacherAssignment?.filter((a) => a.role === "SUPERVISOR") || [];

  // Unique branches from all assignments
  const branches = Array.from(new Set((teacherData?.TeacherAssignment || []).map((a) => a.Branch.id)))
    .map((branchId) => (teacherData?.TeacherAssignment || []).find((a) => a.Branch.id === branchId)?.Branch)
    .filter(Boolean) as any[];

  // Classes/subjects from regular assignments, supervised classes from supervisor assignments
  const classes = regularAssignments.map((a) => a.Class) || [];
  const subjects = (regularAssignments.map((a) => a.Subject).filter(Boolean) as any[]) || [];
  const supervisedClasses = supervisorAssignments.map((a) => a.Class) || [];

  const relatedData = {
    branches,
    classes,
    subjects,
    supervisedClasses,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* TIMETABLE SECTION HEADER */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Timetables</h1>
              <p className="text-sm text-gray-600">View and manage your teaching schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your timetable...</p>
              </div>
            </div>
          </div>
        }>
          <TeacherTimetableContainer 
            teacherId={teacherId!} 
            teacherData={teacherData}
            relatedData={relatedData}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default TeacherTimetablesPage;
