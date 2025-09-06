"use client";

import React from "react";

type Column = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
};

export function SDSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div className="mb-4">
      <input
        className="border rounded px-3 py-2 w-full max-w-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
      />
    </div>
  );
}

export function SDPagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void; }) {
  const prev = () => onPageChange(Math.max(1, currentPage - 1));
  const next = () => onPageChange(Math.min(totalPages || 1, currentPage + 1));
  return (
    <div className="flex items-center justify-end gap-2 mt-3">
      <button className="px-2 py-1 border rounded text-sm disabled:opacity-50" onClick={prev} disabled={currentPage <= 1}>Prev</button>
      <span className="text-xs text-gray-500">Page {currentPage} of {totalPages || 1}</span>
      <button className="px-2 py-1 border rounded text-sm disabled:opacity-50" onClick={next} disabled={currentPage >= (totalPages || 1)}>Next</button>
    </div>
  );
}

export function SDTable({ data, columns, isLoading }: { data: any[]; columns: Column[]; isLoading?: boolean; }) {
  if (isLoading) return <p className="text-gray-600">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            {columns.map((c) => (
              <th key={c.key} className="py-2">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={row.id ?? idx} className="border-b last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="py-2">
                  {c.render ? c.render(row) : (row as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


