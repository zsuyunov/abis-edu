'use client';

import React, { useState, useMemo } from 'react';
import { useDataQuery } from '@/components/providers/LoadingProvider';
import VirtualizedTable, { StudentTable } from '@/components/VirtualizedTable';
import { TableSkeleton } from '@/components/ui/skeleton';
import FormContainer from '@/components/FormContainer';
import ArchiveRestoreButton from '@/components/ArchiveRestoreButton';
import Pagination from '@/components/Pagination';
import TableSearch from '@/components/TableSearch';
import Image from 'next/image';
import Link from 'next/link';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phone: string;
  dateOfBirth: Date;
  status: 'ACTIVE' | 'INACTIVE';
  class: {
    name: string;
    branch: {
      shortName: string;
    };
  };
  parent: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  branch: {
    shortName: string;
  };
}

interface StudentsResponse {
  data: Student[];
  count: number;
  totalPages: number;
  currentPage: number;
}

interface OptimizedStudentsListProps {
  role: string;
  initialSearchParams: { [key: string]: string | undefined };
}

const OptimizedStudentsList: React.FC<OptimizedStudentsListProps> = ({
  role,
  initialSearchParams,
}) => {
  const [searchParams, setSearchParams] = useState(initialSearchParams);
  const [page, setPage] = useState(
    initialSearchParams.page ? parseInt(initialSearchParams.page) : 1
  );

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value);
      }
    });
    
    return params.toString();
  }, [searchParams, page]);

  // Fetch students data with caching
  const {
    data: studentsData,
    isLoading,
    error,
    refetch,
  } = useDataQuery<StudentsResponse>(
    ['students', queryParams],
    async () => {
      const response = await fetch(`/api/students/optimized?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const columns = [
    {
      header: "Info",
      accessor: "info",
      width: 250,
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
      width: 120,
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
      width: 150,
    },
    {
      header: "Branch",
      accessor: "branch",
      className: "hidden lg:table-cell",
      width: 100,
    },
    {
      header: "Parent",
      accessor: "parent",
      className: "hidden lg:table-cell",
      width: 200,
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden lg:table-cell",
      width: 100,
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
            width: 200,
          },
        ]
      : []),
  ];

  const renderRow = (item: Student, index: number) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      style={{ height: '80px' }}
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">{item.phone}</p>
          <p className="text-xs text-gray-500">
            {item.branch?.shortName ? `Branch: ${item.branch.shortName}` : 'Not assigned to branch'}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {item.studentId}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col">
          <span className="font-medium">{item.class.name}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <span className="text-xs">{item.branch.shortName}</span>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col">
          <span className="text-xs">{item.parent.firstName} {item.parent.lastName}</span>
          <span className="text-xs text-gray-500">{item.parent.phone}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.status}
        </span>
      </td>
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/admin/list/students/${item.id}`}>
                          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
            </Link>
            <FormContainer table="student" type="update" data={item} />
            <FormContainer table="student" type="transfer" data={item} />
            <FormContainer table="student" type="resetPassword" data={item} />
            <FormContainer table="student" type="sendMessage" data={item} />
            {/* Single yellow toggle for archive/restore */}
            {item.status === "ACTIVE" ? (
              <FormContainer table="student" type="archive" data={item} />
            ) : (
              <FormContainer table="student" type="restore" data={item} />
            )}
            {/* Purple delete button */}
            <FormContainer table="student" type="delete" data={item} />
          </div>
        </td>
      )}
    </tr>
  );

  const handleSearch = (searchTerm: string) => {
    setSearchParams(prev => ({ ...prev, search: searchTerm }));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load students</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="student" type="create" />}
          </div>
        </div>
      </div>

      {/* LIST */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={columns.length} />
      ) : studentsData?.data && studentsData.data.length > 0 ? (
        <StudentTable
          students={studentsData.data}
          loading={false}
          height={600}
          itemHeight={80}
        />
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No students found</p>
        </div>
      )}

      {/* PAGINATION */}
      {studentsData && (
        <Pagination
          page={studentsData.currentPage}
          count={studentsData.count}
        />
      )}
    </div>
  );
};

export default OptimizedStudentsList;
