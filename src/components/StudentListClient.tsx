"use client";

import { useState, useEffect } from "react";
import FormContainer from "@/components/FormContainer";
import SmallResetPasswordModal from "@/components/SmallResetPasswordModal";
import SmallSendMessageModal from "@/components/SmallSendMessageModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AssignmentStatusFilter from "@/components/AssignmentStatusFilter";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface StudentListClientProps {
  initialData: any[];
  totalCount: number;
  currentPage: number;
  role: string;
  currentUserId: string;
}

type StudentList = any;

export default function StudentListClient({ 
  initialData, 
  totalCount, 
  currentPage, 
  role, 
  currentUserId 
}: StudentListClientProps) {
  const [data, setData] = useState(initialData);
  const [count, setCount] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Function to fetch students data
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/students?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.students || []);
        setCount(result.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch data when search parameters change
  useEffect(() => {
    fetchStudents();
  }, [searchParams]);

  const columns = [
    {
      header: "Number",
      accessor: "number",
      className: "hidden sm:table-cell",
    },
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Parent",
      accessor: "parent",
      className: "hidden lg:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden lg:table-cell",
    },
    {
      header: "Assignment Status",
      accessor: "assignmentStatus",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: StudentList) => {
    const index = data.findIndex(d => d.id === item.id);
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="hidden sm:table-cell p-4 font-mono text-sm text-gray-600">
          {(currentPage - 1) * 30 + index + 1}
        </td>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">{item.phone}</p>
          <p className="text-xs text-gray-500">Born: {item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {item.studentId}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col">
          {item.studentParents && item.studentParents.length > 0 ? (
            <>
              <span className="text-xs">{item.studentParents[0].parent.firstName} {item.studentParents[0].parent.lastName}</span>
              <span className="text-xs text-gray-500">{item.studentParents[0].parent.phone}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">No parent assigned</span>
          )}
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
      <td className="hidden lg:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.classId !== null
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {item.classId !== null ? "Assigned" : "Unassigned"}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/admin/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {/* Debug: Always show buttons for testing */}
          <FormContainer
            table="parentAssign"
            type="assign"
            data={{ 
              studentId: item.id, 
              studentName: `${item.firstName} ${item.lastName}`,
              firstName: item.firstName,
              lastName: item.lastName
            }}
            currentUserId={currentUserId}
          />
          <FormContainer
            table="student"
            type="update"
            data={item}
            currentUserId={currentUserId}
          />
          <SmallResetPasswordModal
            studentId={item.id}
            studentName={`${item.firstName} ${item.lastName}`}
            currentUserId={currentUserId}
          />
          <SmallSendMessageModal
            studentId={item.id}
            studentName={`${item.firstName} ${item.lastName}`}
            currentUserId={currentUserId}
          />
          <FormContainer table="studentAssignment" type="create" data={item} />
          {item.status === "ACTIVE" ? (
            <FormContainer
              table="student"
              type="archive"
              data={item}
              currentUserId={currentUserId}
            />
          ) : (
            <FormContainer
              table="student"
              type="restore"
              data={item}
              currentUserId={currentUserId}
            />
          )}
          <FormContainer
            table="student"
            type="delete"
            data={item}
            currentUserId={currentUserId}
          />
        </div>
      </td>
    </tr>
    );
  };


  return (
    <>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
            <p className="text-xs text-gray-500">Role: {role || "No role"} | User ID: {currentUserId || "No ID"}</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <AssignmentStatusFilter />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              <FormContainer table="student" type="create" />
            </div>
          </div>
        </div>
        {/* LIST */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lamaSky"></div>
          </div>
        ) : (
          <Table columns={columns} renderRow={renderRow} data={data} />
        )}
        {/* PAGINATION */}
        <Pagination page={currentPage} count={count} />
      </div>

    </>
  );
}
