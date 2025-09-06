"use client";

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TableSkeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  minWidth?: number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  itemHeight?: number;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  emptyMessage?: string;
  stickyHeader?: boolean;
}

interface RowProps<T> {
  index: number;
  style: React.CSSProperties;
  data: {
    items: T[];
    columns: Column<T>[];
    onRowClick?: (item: T, index: number) => void;
    rowClassName?: string | ((item: T, index: number) => string);
  };
}

function TableRow({ index, style, data }: any) {
  const { items, columns, onRowClick, rowClassName } = data;
  const item = items[index];

  const handleClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(item, index);
    }
  }, [onRowClick, item, index]);

  const rowClass = useMemo(() => {
    if (typeof rowClassName === 'function') {
      return rowClassName(item, index);
    }
    return rowClassName;
  }, [rowClassName, item, index]);

  return (
    <div
      style={style}
      className={cn(
        "flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors",
        onRowClick && "cursor-pointer",
        index % 2 === 0 ? "bg-white" : "bg-gray-50/50",
        rowClass
      )}
      onClick={handleClick}
    >
      {columns.map((column: any, colIndex: number) => {
        const value = item[column.key];
        const content = column.render ? column.render(value, item, index) : String(value || '');
        
        return (
          <div
            key={String(column.key)}
            className={cn(
              "px-4 py-3 text-sm text-gray-900 truncate",
              column.className
            )}
            style={{
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.minWidth || 100,
              flexShrink: 0,
            }}
            title={typeof content === 'string' ? content : undefined}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function VirtualizedTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 60,
  loading = false,
  onRowClick,
  className,
  headerClassName,
  rowClassName,
  emptyMessage = "No data available",
  stickyHeader = true,
}: VirtualizedTableProps<T>) {
  const rowData = useMemo(() => ({
    items: data,
    columns,
    onRowClick,
    rowClassName,
  }), [data, columns, onRowClick, rowClassName]);

  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm border", className)}>
        <TableSkeleton rows={Math.floor(height / itemHeight)} cols={columns.length} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm border p-8 text-center", className)}>
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border overflow-hidden", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex bg-gray-50 border-b border-gray-200",
          stickyHeader && "sticky top-0 z-10",
          headerClassName
        )}
      >
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate"
            style={{
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.minWidth || 100,
              flexShrink: 0,
            }}
            title={column.header}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div style={{ height }}>
        <AutoSizer>
          {({ height: autoHeight, width }) => (
            <List
              height={autoHeight}
              width={width}
              itemCount={data.length}
              itemSize={itemHeight}
              itemData={rowData}
              overscanCount={5}
            >
              {TableRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

// Specialized components for common use cases
export function StudentTable({
  students,
  loading,
  onStudentClick,
  ...props
}: {
  students: any[];
  loading?: boolean;
  onStudentClick?: (student: any) => void;
} & Omit<VirtualizedTableProps<any>, 'data' | 'columns' | 'onRowClick'>) {
  const columns: Column<any>[] = [
    {
      key: 'studentId',
      header: 'Student ID',
      width: 120,
      className: 'font-medium text-blue-600',
    },
    {
      key: 'firstName',
      header: 'First Name',
      width: 150,
    },
    {
      key: 'lastName',
      header: 'Last Name',
      width: 150,
    },
    {
      key: 'class',
      header: 'Class',
      width: 100,
      render: (value) => value?.name || '-',
    },
    {
      key: 'branch',
      header: 'Branch',
      width: 120,
      render: (value) => value?.shortName || '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (value) => (
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            value === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <VirtualizedTable
      data={students}
      columns={columns}
      loading={loading}
      onRowClick={onStudentClick}
      emptyMessage="No students found"
      {...props}
    />
  );
}

export function AttendanceTable({
  attendance,
  loading,
  onAttendanceClick,
  ...props
}: {
  attendance: any[];
  loading?: boolean;
  onAttendanceClick?: (record: any) => void;
} & Omit<VirtualizedTableProps<any>, 'data' | 'columns' | 'onRowClick'>) {
  const columns: Column<any>[] = [
    {
      key: 'date',
      header: 'Date',
      width: 120,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'student',
      header: 'Student',
      width: 200,
      render: (value) => `${value?.firstName} ${value?.lastName}`,
    },
    {
      key: 'class',
      header: 'Class',
      width: 100,
      render: (value) => value?.name || '-',
    },
    {
      key: 'subject',
      header: 'Subject',
      width: 120,
      render: (value) => value?.name || '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (value) => (
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            value === 'PRESENT'
              ? 'bg-green-100 text-green-800'
              : value === 'ABSENT'
              ? 'bg-red-100 text-red-800'
              : value === 'LATE'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          )}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      width: 150,
      render: (value) => `${value?.firstName} ${value?.lastName}`,
    },
  ];

  return (
    <VirtualizedTable
      data={attendance}
      columns={columns}
      loading={loading}
      onRowClick={onAttendanceClick}
      emptyMessage="No attendance records found"
      {...props}
    />
  );
}

export function TeacherTable({
  teachers,
  loading,
  onTeacherClick,
  ...props
}: {
  teachers: any[];
  loading?: boolean;
  onTeacherClick?: (teacher: any) => void;
} & Omit<VirtualizedTableProps<any>, 'data' | 'columns' | 'onRowClick'>) {
  const columns: Column<any>[] = [
    {
      key: 'teacherId',
      header: 'Teacher ID',
      width: 120,
      className: 'font-medium text-blue-600',
    },
    {
      key: 'firstName',
      header: 'First Name',
      width: 150,
    },
    {
      key: 'lastName',
      header: 'Last Name',
      width: 150,
    },
    {
      key: 'email',
      header: 'Email',
      width: 200,
      render: (value) => value || '-',
    },
    {
      key: 'branch',
      header: 'Branch',
      width: 120,
      render: (value) => value?.shortName || '-',
    },
    {
      key: 'subjects',
      header: 'Subjects',
      width: 200,
      render: (value) => value?.map((s: any) => s.name).join(', ') || '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (value) => (
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            value === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <VirtualizedTable
      data={teachers}
      columns={columns}
      loading={loading}
      onRowClick={onTeacherClick}
      emptyMessage="No teachers found"
      {...props}
    />
  );
}
