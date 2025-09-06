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
    branch: {
      shortName: string;
    };
  };
  parent: {
    firstName: string;
    lastName: string;
  };
  branch: {
    shortName: string;
  };
  createdAt: string;
}

interface Branch {
  id: number;
  shortName: string;
  legalName: string;
}

const ITEM_PER_PAGE = 10;

const MainAdmissionStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "",
    branchId: "",
  });

  useEffect(() => {
    fetchBranches();
    fetchStudents();
  }, [page, searchParams]);

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches");
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => v))
      });
      
      const response = await fetch(`/api/main-admission/students?${params}`);
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
      header: "Branch",
      accessor: "branch",
      className: "hidden lg:table-cell",
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
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaYellowLight"
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item.branch?.shortName}
        </span>
      </td>
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
          <Link href={`/main-admission/students/${item.id}`}>
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
          <span className="text-emerald-600 font-medium">Loading Students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-4 rounded-lg mb-6">
        <h1 className="text-xl font-bold text-emerald-800 mb-2">Student Management - All Branches</h1>
        <p className="text-emerald-600 text-sm">Manage students across all branches with full CRUD permissions</p>
      </div>

      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="hidden md:block text-lg font-semibold">All Students ({count})</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {/* Branch Filter */}
            <select
              value={searchParams.branchId}
              onChange={(e) => handleFilterChange("branchId", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={searchParams.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            <FormContainer table="student" type="create" />
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={students} />
      
      {/* PAGINATION */}
      <Pagination page={page} count={count} />
    </div>
  );
};

export default MainAdmissionStudents;
