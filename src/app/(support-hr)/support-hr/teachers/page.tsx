"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

import Image from "next/image";
import { useState, useEffect } from "react";

type Teacher = {
  id: string;
  teacherId: string;
  name: string;
  email?: string;
  phone: string;
  subjects: string[];
  classes: string[];
  branch: string;
  address: string;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Classes",
    accessor: "classes",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const SupportHRTeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchName, setBranchName] = useState("");

  const renderRow = (item: Teacher) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/noAvatar.png"
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">ID: {item.teacherId}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.teacherId}</td>
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.subjects.map((subject) => (
            <span
              key={subject}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              {subject}
            </span>
          ))}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.classes.map((cls) => (
            <span
              key={cls}
              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
            >
              {cls}
            </span>
          ))}
        </div>
      </td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal table="teacher" type="update" data={item} />
          <FormModal table="teacher" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/support-hr/teachers?page=${currentPage}&search=${searchTerm}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTeachers(data.teachers);
        setTotalPages(data.totalPages);
        setBranchName(data.branchName);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          Teachers Management {branchName && `(${branchName})`}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormModal table="teacher" type="create" />
          </div>
        </div>
      </div>

      {/* NEW ASSIGNMENT WORKFLOW INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">📋</div>
          <div>
            <h3 className="text-blue-800 font-semibold text-sm mb-1">New Teacher Assignment System</h3>
            <p className="text-blue-700 text-xs mb-2">
              Teachers are now created without subject/class requirements and go into an "Unassigned Teachers" pool.
            </p>
            <div className="text-blue-600 text-xs">
              <strong>Workflow:</strong> Create Teacher → Assign as Class Supervisor (optional) → Use "Teacher Assignments" to assign subjects & classes
            </div>
          </div>
        </div>
      </div>
      
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={teachers} />
      
      {/* PAGINATION */}
            <Pagination
        page={currentPage}
        count={totalPages * 10}
      />
    </div>
  );
};

export default SupportHRTeachersPage;
