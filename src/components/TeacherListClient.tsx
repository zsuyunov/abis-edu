"use client";

import { useState, useEffect } from "react";
import FormContainer from "@/components/FormContainer";
import TeacherActionModal from "@/components/TeacherActionModal";
import TeacherDeleteModal from "@/components/TeacherDeleteModal";
import SmallTeacherResetPasswordModal from "@/components/SmallTeacherResetPasswordModal";
import SmallTeacherSendMessageModal from "@/components/SmallTeacherSendMessageModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import AssignmentStatusFilter from "@/components/AssignmentStatusFilter";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeacherListClientProps {
  initialData: any[];
  totalCount: number;
  currentPage: number;
  role: string;
  currentUserId: string;
}

type TeacherList = any;

export default function TeacherListClient({ 
  initialData, 
  totalCount, 
  currentPage, 
  role, 
  currentUserId 
}: TeacherListClientProps) {
  const [data, setData] = useState(initialData);
  const [count, setCount] = useState(totalCount);
  const router = useRouter();

  // Update state when props change (e.g., when page changes)
  useEffect(() => {
    setData(initialData);
    setCount(totalCount);
  }, [initialData, totalCount]);

  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "hidden sm:table-cell",
    },
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="hidden sm:table-cell p-4 font-mono text-sm text-gray-600">
        #{item.id}
      </td>
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/noAvatar.png"
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">{item.email || 'No email'}</p>
          <p className="text-xs text-gray-500">Born: {item.dateOfBirth ? item.dateOfBirth.toLocaleDateString() : 'Not provided'}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell">{item.address}</td>
      <td className="hidden lg:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.TeacherAssignment && item.TeacherAssignment.length > 0
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {item.TeacherAssignment && item.TeacherAssignment.length > 0 ? "Assigned" : "Unassigned"}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/admin/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {/* Debug: Always show buttons for testing */}
          <FormContainer
            table="teacher"
            type="update"
            data={item}
            currentUserId={currentUserId}
          />
          <FormContainer
            table="teacherAssignment"
            type="assign"
            data={item}
            currentUserId={currentUserId}
          />
          <SmallTeacherResetPasswordModal
            userId={item.teacherId}
            userName={`${item.firstName} ${item.lastName}`}
            currentUserId={currentUserId}
          />
          <SmallTeacherSendMessageModal
            userId={item.teacherId}
            userName={`${item.firstName} ${item.lastName}`}
            currentUserId={currentUserId}
          />
          {item.status === "ACTIVE" ? (
            <TeacherActionModal
              table="teacher"
              type="archive"
              data={item}
              currentUserId={currentUserId}
            />
          ) : (
            <TeacherActionModal
              table="teacher"
              type="restore"
              data={item}
              currentUserId={currentUserId}
            />
          )}
          <TeacherDeleteModal
            data={item}
            currentUserId={currentUserId}
          />
        </div>
      </td>
    </tr>
  );


  return (
    <>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
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
              <FormContainer table="teacher" type="create" />
            </div>
          </div>
        </div>
        {/* LIST */}
        <Table columns={columns} renderRow={renderRow} data={data} />
        {/* PAGINATION */}
        <Pagination page={currentPage} count={count} />
      </div>

    </>
  );
}
