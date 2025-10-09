'use client';

import React, { useState, useMemo } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { useScopedStudents } from '@/hooks/useScopedData';
import { useOptimisticAttendance } from '@/hooks/useOptimisticUpdates';
import { useHoverPrefetch } from '@/hooks/usePrefetch';
import { useSaveFeedback, useDeleteFeedback, useExportFeedback } from '@/hooks/useActionFeedback';
import { StudentTable } from '@/components/VirtualizedTable';
import { TableSkeleton, DashboardSkeleton } from '@/components/ui/skeleton';
import { Loader, InlineLoader, ButtonLoader } from '@/components/ui/Loader';
import Image from 'next/image';
import Link from 'next/link';
import FormContainer from './FormContainer';

interface SuperFastStudentDashboardProps {
  role: string;
  branchId?: string;
  classId?: string;
}

const SuperFastStudentDashboard: React.FC<SuperFastStudentDashboardProps> = ({
  role,
  branchId,
  classId,
}) => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  // Initialize scoped data with filters
  const {
    data: students,
    count,
    totalPages,
    currentPage,
    isLoading,
    isFetching,
    error,
    search,
    filters,
    activeFilterCount,
    setSearch,
    setFilter,
    clearFilters,
    setSort,
    goToNextPage,
    goToPrevPage,
    refetch,
  } = useScopedStudents({
    branchId,
    classId,
    status: 'ACTIVE',
  });

  // Optimistic updates for attendance
  const { markAttendance, isPending: isMarkingAttendance } = useOptimisticAttendance();

  // Action feedback hooks
  const { saveWithFeedback } = useSaveFeedback();
  const { deleteWithFeedback } = useDeleteFeedback();
  const { exportWithFeedback } = useExportFeedback();

  // Hover prefetching
  const { prefetchOnHover } = useHoverPrefetch();

  // Quick attendance marking
  const handleQuickAttendance = async (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  ) => {
    try {
      await markAttendance(
        studentId,
        status,
        new Date().toISOString().split('T')[0],
        classId || 'default'
      );
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  // Bulk operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedStudents.size === 0) return;

    try {
      switch (bulkAction) {
        case 'export':
          await exportWithFeedback(
            async () => {
              const response = await csrfFetch('/api/students/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentIds: Array.from(selectedStudents),
                  format: 'xlsx',
                }),
              });
              if (!response.ok) throw new Error('Export failed');
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `students-${Date.now()}.xlsx`;
              a.click();
              return { success: true };
            },
            {
              format: 'Excel',
              filename: `${selectedStudents.size} students`,
            }
          );
          break;

        case 'mark-present':
          const today = new Date().toISOString().split('T')[0];
          await Promise.all(
            Array.from(selectedStudents).map(studentId =>
              markAttendance(studentId, 'PRESENT', today, classId || 'default')
            )
          );
          break;

        case 'send-notification':
          await saveWithFeedback(
            async () => {
              const response = await csrfFetch('/api/notifications/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentIds: Array.from(selectedStudents),
                  message: 'Important notification',
                }),
              });
              if (!response.ok) throw new Error('Failed to send notifications');
              return response.json();
            },
            { entityName: 'notifications', showProgress: true }
          );
          break;
      }

      // Clear selection after successful action
      setSelectedStudents(new Set());
      setBulkAction('');
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // Student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const selectAllStudents = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  // Enhanced student row renderer with optimistic updates
  const renderStudentRow = (student: any, index: number) => (
    <tr
      key={student.id}
      className={`border-b border-gray-200 text-sm hover:bg-blue-50 transition-colors ${
        selectedStudents.has(student.id) ? 'bg-blue-100' : 'even:bg-slate-50'
      }`}
    >
      <td className="p-4">
        <input
          type="checkbox"
          checked={selectedStudents.has(student.id)}
          onChange={() => toggleStudentSelection(student.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{student.firstName} {student.lastName}</h3>
          <p className="text-xs text-gray-500">{student.phone}</p>
          <p className="text-xs text-gray-500">
            {student.branch?.shortName ? `Branch: ${student.branch.shortName}` : 'Not assigned to branch'}
          </p>
        </div>
      </td>

      <td className="hidden md:table-cell">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {student.studentId}
        </span>
      </td>

      <td className="hidden md:table-cell">
        <span className="font-medium">{student.class?.name}</span>
      </td>

      <td className="hidden lg:table-cell">
        <span className="text-xs">{student.branch?.shortName}</span>
      </td>

      {/* Quick Attendance Actions */}
      <td className="hidden lg:table-cell">
        <div className="flex gap-1">
          {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(status => (
            <button
              key={status}
              onClick={() => handleQuickAttendance(student.id, status as any)}
              disabled={isMarkingAttendance(`${student.id}-${new Date().toISOString().split('T')[0]}`)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                status === 'PRESENT' ? 'bg-green-100 hover:bg-green-200 text-green-800' :
                status === 'ABSENT' ? 'bg-red-100 hover:bg-red-200 text-red-800' :
                status === 'LATE' ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' :
                'bg-blue-100 hover:bg-blue-200 text-blue-800'
              } disabled:opacity-50`}
            >
              {isMarkingAttendance(`${student.id}-${new Date().toISOString().split('T')[0]}`) ? (
                <InlineLoader size="sm" />
              ) : (
                status.charAt(0)
              )}
            </button>
          ))}
        </div>
      </td>

      <td className="hidden lg:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            student.status === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {student.status}
        </span>
      </td>

      {/* Actions with hover prefetching */}
      <td>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/list/students/${student.id}`}
            {...prefetchOnHover(`/admin/list/students/${student.id}`)}
          >
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
              <Image src="/view.png" alt="View" width={16} height={16} />
            </button>
          </Link>
          
          {role === 'admin' && (
            <>
              <FormContainer table="student" type="update" data={student} />
              <FormContainer table="student" type="transfer" data={student} />
              <FormContainer table="student" type="resetPassword" data={student} />
              <FormContainer table="student" type="sendMessage" data={student} />
              {student.status === "ACTIVE" ? (
                <FormContainer table="student" type="archive" data={student} />
              ) : (
                <FormContainer table="student" type="restore" data={student} />
              )}
              <FormContainer table="student" type="delete" data={student} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load students</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <ButtonLoader loading={isFetching}>
                Retry
              </ButtonLoader>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header with real-time stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Students Dashboard</h1>
          <p className="text-sm text-gray-600">
            {count} total students
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {activeFilterCount} filters active
              </span>
            )}
          </p>
        </div>
        
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <InlineLoader size="sm" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilter('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedStudents.size} students selected
          </span>
          
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Choose action...</option>
            <option value="export">Export to Excel</option>
            <option value="mark-present">Mark Present</option>
            <option value="send-notification">Send Notification</option>
          </select>
          
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Execute
          </button>
          
          <button
            onClick={() => setSelectedStudents(new Set())}
            className="px-4 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Students Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={8} showHeader />
      ) : students.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === students.length && students.length > 0}
                    onChange={selectAllStudents}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Student ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Quick Attendance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(renderStudentRow)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 border border-gray-200 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No students found</p>
            <button
              onClick={() => clearFilters()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages} ({count} total students)
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded">
              {currentPage}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperFastStudentDashboard;
