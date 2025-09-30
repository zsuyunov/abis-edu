import { Suspense } from "react";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
import TeacherGradePageClient from "@/components/TeacherGradePageClient";
import prisma from "@/lib/prisma";

const TeacherGradebookPage = async () => {
  const headersList = headers();
  const teacherId = headersList.get("x-user-id");

  if (!teacherId) {
    return <div>Unauthorized</div>;
  }

  // Fetch teacher's classes and subjects
  const teacherData = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      TeacherAssignment: {
        include: {
          Class: true,
          Subject: true,
          AcademicYear: true,
          Branch: true
        }
      }
    }
  });

  if (!teacherData) {
    return <div>Teacher not found</div>;
  }

  // Extract unique data from assignments
  const teacherClasses = Array.from(
    new Map(
      teacherData.TeacherAssignment.map(assignment => [
        assignment.Class.id,
        { id: assignment.Class.id, name: assignment.Class.name }
      ])
    ).values()
  );

  const teacherSubjects = Array.from(
    new Map(
      teacherData.TeacherAssignment
        .filter(assignment => assignment.Subject)
        .map(assignment => [
          assignment.Subject!.id,
          { id: assignment.Subject!.id, name: assignment.Subject!.name }
        ])
    ).values()
  );

  const academicYears = Array.from(
    new Map(
      teacherData.TeacherAssignment.map(assignment => [
        assignment.AcademicYear.id,
        { id: assignment.AcademicYear.id, name: assignment.AcademicYear.name }
      ])
    ).values()
  );

  const branches = Array.from(
    new Map(
      teacherData.TeacherAssignment.map(assignment => [
        assignment.Branch.id,
        { id: assignment.Branch.id, name: assignment.Branch.shortName }
      ])
    ).values()
  );

  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-md"></div>}>
      <TeacherGradePageClient 
        teacherClasses={teacherClasses}
        teacherSubjects={teacherSubjects}
        academicYears={academicYears}
        branches={branches}
        teacherId={teacherId}
      />
    </Suspense>
  );
};

export default TeacherGradebookPage;
