"use client";

import { ReactNode } from "react";

interface Column {
  header: string;
  accessor: string;
  className?: string;
}

interface MDTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any) => ReactNode;
  loading?: boolean;
}

const MDTable = ({ columns, data, renderRow, loading }: MDTableProps) => {
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item, index) => renderRow(item))
        ) : (
          <tr>
            <td colSpan={columns.length} className="text-center py-8 text-gray-500">
              No data available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default MDTable;
