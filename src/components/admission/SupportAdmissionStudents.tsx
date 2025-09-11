/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainer from "@/components/FormContainer";

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  branchId: number;
  classId: number;
  parentId: string;
  class: {
    name: string;
  };
  parent: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface BranchInfo {
  id: number;
  shortName: string;
  legalName: string;
}

const ITEM_PER_PAGE = 10;

const SupportAdmissionStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "",
  });

  useEffect(() => {
    fetchBranchInfo();
    fetchStudents();
  }, [page, searchParams]);

  const fetchBranchInfo = async () => {
    try {
      const response = await fetch("/api/support-admission/branch-info");
      if (response.ok) {
        const data = await response.json();
        setBranchInfo(data.branch);
      }
    } catch (error) {
      console.error("Error fetching branch info:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => v))
      });
      
      const response = await fetch(`/api/support-admission/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setCount(data.count || 0);
      } else {
        toast.error("Failed to load students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Error loading students");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchParams(prev => ({ ...prev, search }));
    setPage(1);
  };

  const handleFilterChange = (filter: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [filter]: value }));
    setPage(1);
  };

  const columns = [
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
      header: "Class",
      accessor: "class",
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
      header: "Actions",
      accessor: "action",
    },
  ];

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-purple-50"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.firstName} {item.lastName}</h3>
          <p className="text-xs text-gray-500">{item.phone}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.studentId}</td>
      <td className="hidden md:table-cell">{item.class?.name}</td>
      <td className="hidden lg:table-cell">
        {item.parent ? `${item.parent.firstName} ${item.parent.lastName}` : 'N/A'}
      </td>
      <td className="hidden lg:table-cell">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.status === 'ACTIVE' 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/support-admission/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 active:scale-95">
              <Image src="/view.png" alt="View" width={16} height={16} />
            </button>
          </Link>
          <FormContainer table="student" type="update" data={item} />
          <FormContainer table="student" type="transfer" data={item} />
          <FormContainer table="student" type="resetPassword" data={item} />
          <FormContainer table="student" type="sendMessage" data={item} />
          {item.status === "ACTIVE" ? (
            <FormContainer table="student" type="archive" data={item} />
          ) : (
            <FormContainer table="student" type="restore" data={item} />
          )}
          <FormContainer table="student" type="delete" data={item} />
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-4">
          <Image src="/loader-beruniy.gif" alt="Loading..." width={50} height={50} />
          <span className="text-purple-600 font-medium">Loading Students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header }
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-full">
            <Image src="/singleBranch.png" alt="Branch" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-purple-800 mb-1">
              Student Management - {branchInfo?.shortName || 'Your Branch'}
            </h1>
            <p className="text-purple-600 text-sm">
              Manage students in your assigned branch only
            </p>
          </div>
        </div>
      </div>

      {/* TOP }
      <div className="flex items-center justify-between mb-4">
        <h2 className="hidden md:block text-lg font-semibold">Branch Students ({count})</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {/* Status Filter }
            <select
              value={searchParams.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            <FormContainer table="student" type="create" />
          </div>
        </div>
      </div>

      {/* Branch Restriction Notice }
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <Image src="/singleBranch.png" alt="Branch" width={16} height={16} />
          </div>
          <div>
            <p className="text-sm text-purple-700 font-medium">Branch Restriction Active</p>
            <p className="text-xs text-purple-600">
              You can only create and manage students for {branchInfo?.shortName || 'your assigned branch'}. 
              Branch selection is automatically locked to your assigned branch.
            </p>
          </div>
        </div>
      </div>

      {/* LIST }
      <Table columns={columns} renderRow={renderRow} data={students} />
      
      {/* PAGINATION }
      <Pagination page={page} count={count} />
    </div>
  );
};

export default SupportAdmissionStudents;


*/