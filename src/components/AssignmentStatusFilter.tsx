"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const AssignmentStatusFilter = () => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set("assignmentStatus", e.target.value);
    } else {
      params.delete("assignmentStatus");
    }
    replace(`${pathname}?${params}`);
  };

  return (
    <select
      name="assignmentStatus"
      id="assignmentStatus"
      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-white text-gray-900"
      onChange={handleFilterChange}
      defaultValue={searchParams.get("assignmentStatus") || ""}
    >
      <option value="">Filter by Assignment</option>
      <option value="assigned">Assigned</option>
      <option value="unassigned">Unassigned</option>
    </select>
  );
};

export default AssignmentStatusFilter;
