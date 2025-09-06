"use client";

import { useRouter, useSearchParams } from "next/navigation";

const UserFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`${window.location.pathname}?${params}`);
  };

  const handlePositionChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("position", value);
    } else {
      params.delete("position");
    }
    router.push(`${window.location.pathname}?${params}`);
  };

  return (
    <div className="flex gap-4 mt-4 mb-4 flex-wrap">
      <select 
        className="px-3 py-2 border rounded-md text-sm"
        value={searchParams.get("status") || ""}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
      
      <select 
        className="px-3 py-2 border rounded-md text-sm"
        value={searchParams.get("position") || ""}
        onChange={(e) => handlePositionChange(e.target.value)}
      >
        <option value="">All Positions</option>
        <option value="MAIN_DIRECTOR">Main Director</option>
        <option value="SUPPORT_DIRECTOR">Support Director</option>
        <option value="MAIN_HR">Main HR</option>
        <option value="SUPPORT_HR">Support HR</option>
        <option value="MAIN_ADMISSION">Main Admission</option>
        <option value="SUPPORT_ADMISSION">Support Admission</option>
        <option value="DOCTOR">Doctor</option>
        <option value="CHIEF">Chief</option>
      </select>
    </div>
  );
};

export default UserFilters;
