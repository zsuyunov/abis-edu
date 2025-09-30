import ModernTeacherDashboard from "@/components/ModernTeacherDashboard";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const TeacherPage = async () => {
  const headersList = headers();
  const userId = headersList.get("x-user-id");

  // Fetch assigned data to display on dashboard header
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
    include: {
      TeacherAssignment: {
        include: {
          Branch: true,
          Class: { include: { branch: true, academicYear: true } },
          Subject: true,
          AcademicYear: true,
        },
      },
    },
  });

  if (!teacher) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher not found</h2>
          <p className="text-gray-600">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Transform assignments for the modern dashboard
  const transformedAssignments = teacher.TeacherAssignment.map(assignment => ({
    id: assignment.id,
    role: assignment.role,
    Class: {
      id: assignment.Class.id,
      name: assignment.Class.name,
      branch: assignment.Class.branch ? {
        shortName: assignment.Class.branch.shortName
      } : undefined
    },
    Subject: assignment.Subject ? {
      id: assignment.Subject.id,
      name: assignment.Subject.name
    } : undefined,
    Branch: {
      id: assignment.Branch.id,
      shortName: assignment.Branch.shortName
    },
    AcademicYear: {
      id: assignment.AcademicYear.id,
      name: assignment.AcademicYear.name
    }
  }));

  return (
    <div className="w-full">
      <ModernTeacherDashboard 
        teacher={{
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          role: 'Subject Teacher'
        }}
        assignments={transformedAssignments}
      />
    </div>
  );
};

export default TeacherPage;
