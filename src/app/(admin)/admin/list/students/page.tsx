import { headers } from "next/headers";
import SuperFastStudentDashboard from "@/components/SuperFastStudentDashboard";

const AdminStudentsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";
  const branchIdHeader = headersList.get("x-branch-id");
  const branchId = branchIdHeader ? branchIdHeader : undefined;

  // Extract class filter from search params
  const classId = searchParams?.classId;

  return (
    <SuperFastStudentDashboard
      role={role}
      branchId={branchId}
      classId={classId}
    />
  );
};

export default AdminStudentsPage;
