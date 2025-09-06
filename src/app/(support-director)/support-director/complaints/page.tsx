"use client";

import { useState } from "react";
import { useSDComplaints } from "@/hooks/useSupportDirector";

export default function SDComplaintsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useSDComplaints(page, search);
  return (
    <div className="bg-white p-4 rounded-md m-4 mt-0">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-semibold">Complaints (Branch)</h1>
        <input className="border rounded px-2 py-1 text-sm" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search..." />
      </div>
      {error && <div className="text-red-600">{String(error)}</div>}
      {isLoading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Title</th>
              <th className="py-2">User</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data || []).map((c: any)=> (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2">{c.title}</td>
                <td className="py-2">{c.user?.firstName} {c.user?.lastName}</td>
                <td className="py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


