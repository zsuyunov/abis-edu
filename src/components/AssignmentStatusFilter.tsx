"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const AssignmentStatusFilter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (e.target.value) {
      params.set("assignmentStatus", e.target.value);
    } else {
      params.delete("assignmentStatus");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      name="assignmentStatus"
      id="assignmentStatus"
      className="p-2 border rounded"
      onChange={handleFilterChange}
      defaultValue={searchParams.get("assignmentStatus") || ""}
    >
      <option value="">All Assignments</option>
      <option value="assigned">Assigned</option>
      <option value="unassigned">Unassigned</option>
    </select>
  );
};

export default AssignmentStatusFilter;
