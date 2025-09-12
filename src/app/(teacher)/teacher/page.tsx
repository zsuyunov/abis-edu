import OptimizedTeacherScheduleDashboard from "@/components/OptimizedTeacherScheduleDashboard";
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

  // Get all assignments (both TEACHER and SUPERVISOR roles)
  const allAssignments = teacher?.TeacherAssignment || [];
  const regularAssignments = allAssignments.filter((a) => a.role === "TEACHER");
  const supervisorAssignments = allAssignments.filter((a) => a.role === "SUPERVISOR");
  
  // Get unique branches from all assignments
  const branches = Array.from(new Set(allAssignments.map((a) => a.Branch.id)))
    .map((branchId) => allAssignments.find((a) => a.Branch.id === branchId)?.Branch)
    .filter(Boolean) as any[];
  
  // Get unique classes and subjects from all assignments (both teacher and supervisor)
  const uniqueClassIds = Array.from(new Set(allAssignments.map((a) => a.Class.id)));
  const uniqueSubjectIds = Array.from(new Set(allAssignments.map((a) => a.Subject?.id).filter(Boolean)));
  
  const classes = uniqueClassIds.map(classId => 
    allAssignments.find(a => a.Class.id === classId)?.Class
  ).filter(Boolean);
  const subjects = uniqueSubjectIds.map(subjectId => 
    allAssignments.find(a => a.Subject?.id === subjectId)?.Subject
  ).filter(Boolean);
  
  const supervisedClasses = supervisorAssignments.map((a) => a.Class) || [];
  return (
    <div className="w-full">
      <OptimizedTeacherScheduleDashboard 
        teacherId={userId!} 
        teacherData={{
          id: teacher?.id?.toString() || "",
          firstName: teacher?.firstName || "",
          lastName: teacher?.lastName || "",
          phone: teacher?.phone || "",
          TeacherAssignment: (teacher?.TeacherAssignment || []).map(assignment => ({
            ...assignment,
            id: assignment.id.toString(),
            Branch: {
              id: assignment.Branch.id.toString(),
              name: assignment.Branch.legalName || assignment.Branch.shortName,
              shortName: assignment.Branch.shortName
            },
            Class: {
              ...assignment.Class,
              id: assignment.Class.id.toString(),
              branch: {
                id: assignment.Class.branch.id.toString(),
                name: assignment.Class.branch.legalName || assignment.Class.branch.shortName
              },
              academicYear: {
                ...assignment.Class.academicYear,
                id: assignment.Class.academicYear.id.toString()
              }
            },
            Subject: assignment.Subject ? {
              id: assignment.Subject.id.toString(),
              name: assignment.Subject.name
            } : null,
            AcademicYear: {
              ...assignment.AcademicYear,
              id: assignment.AcademicYear.id.toString()
            }
          }))
        }}
      />
    </div>
  );
};

export default TeacherPage;
