"use client";

import { useState } from "react";
import { useMainDirectorTeachers } from "@/hooks/useMainDirector";

export default function TeachersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useMainDirectorTeachers(page, search);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">All Teachers</h1>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">Read-Only Access</span>
        </div>
        <input
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          placeholder="Search teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-3">
          Failed to load teachers: {error.message}
        </div>
      )}

      <div className="border rounded-lg p-4">
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data || []).map((t: any) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{t.firstName} {t.lastName}</td>
                    <td className="py-2">{t.email}</td>
                    <td className="py-2">{t.phone}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.pagination && (
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <span className="text-xs text-gray-500">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                  onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                  disabled={page >= (data.pagination.totalPages || 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
