import OptimizedStudentScheduleDashboard from "@/components/OptimizedStudentScheduleDashboard";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

const StudentPage = async () => {
  const headersList = headers();
  const userId = headersList.get("x-user-id");

  const studentData = await prisma.student.findUnique({
    where: { id: userId! },
    include: {
      branch: true,
      class: {
        include: {
          branch: true
        }
      }
    }
  });

  if (!studentData) {
    return <div>Student not found</div>;
  }

  return (
    <div className="p-2 sm:p-3">
      <OptimizedStudentScheduleDashboard 
        studentId={userId!} 
        studentData={studentData}
      />
    </div>
  );
};

export default StudentPage;
