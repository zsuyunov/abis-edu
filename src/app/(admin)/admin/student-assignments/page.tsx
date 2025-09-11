"use client";

import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
const role = "admin";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Student, Prisma } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type StudentAssignmentList = Student & {
  class: {
    id: number;
    name: string;
    academicYear: {
      id: number;
      name: string;
      isCurrent: boolean;
    };
  };
  branch: {
    id: number;
    shortName: string;
    district: string;
  };
};

const columns = [
  {
    header: "Student Info",
    accessor: "student",
  },
  {
    header: "Academic Year",
    accessor: "academicYear",
    className: "hidden md:table-cell",
  },
  {
    header: "Branch",
    accessor: "branch",
    className: "hidden md:table-cell",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden lg:table-cell",
  },
  {
    header: "Assigned Date",
    accessor: "createdAt",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: StudentAssignmentList, currentUserId: string) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">
      <Image
        src={"/noAvatar.png"}
        alt=""
        width={40}
        height={40}
        className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
      />
      <div className="flex flex-col">
        <h3 className="font-semibold">
          {item.firstName} {item.lastName}
        </h3>
        <p className="text-xs text-gray-500">{item.studentId}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        item.class.academicYear.isCurrent 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {item.class.academicYear.name}
        {item.class.academicYear.isCurrent && " (Current)"}
      </span>
    </td>
    <td className="hidden md:table-cell">
      <div className="flex flex-col">
        <span className="font-medium">{item.branch.shortName}</span>
        <span className="text-xs text-gray-500">{item.branch.district}</span>
      </div>
    </td>
    <td className="hidden lg:table-cell">
      <span className="font-medium">{item.class.name}</span>
    </td>
    <td className="hidden lg:table-cell">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        item.status === 'ACTIVE' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {item.status}
      </span>
    </td>
    <td className="hidden lg:table-cell">
      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
    </td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer table="studentAssignment" type="update" data={{
              id: item.id,
              studentId: item.id,
              academicYearId: item.class.academicYear.id,
              branchId: item.branchId,
              classId: item.classId,
              student: {
                id: item.id,
                firstName: item.firstName,
                lastName: item.lastName,
                studentId: item.studentId
              },
              academicYear: item.class.academicYear
            }} currentUserId={currentUserId} />
            <FormContainer table="studentAssignment" type="unassign" data={{
              id: item.id,
              studentId: item.id,
              academicYearId: item.class.academicYear.id,
              branchId: item.branchId,
              classId: item.classId,
              student: {
                id: item.id,
                firstName: item.firstName,
                lastName: item.lastName,
                studentId: item.studentId
              },
              academicYear: item.class.academicYear
            }} currentUserId={currentUserId} />
          </>
        )}
      </div>
    </td>
  </tr>
);

const StudentAssignmentsListPage = ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const [assignments, setAssignments] = useState<StudentAssignmentList[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  
  // Filter states
  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Extract helper functions for API responses
  const extractArray = <T,>(obj: any, possibleKeys: string[]): T[] => {
    if (Array.isArray(obj)) return obj as T[];
    for (const key of possibleKeys) {
      if (Array.isArray(obj?.[key])) return obj[key] as T[];
    }
    return [];
  };

  const fetchFilterData = async () => {
    try {
      const [branchesRes, academicYearsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/academic-years"),
      ]);

      const branchesData = await branchesRes.json();
      const academicYearsData = await academicYearsRes.json();

      setBranches(branchesData.branches || branchesData.data || branchesData || []);
      setAcademicYears(academicYearsData.academicYears || academicYearsData.data || academicYearsData || []);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const fetchClasses = async (branchId: string, academicYearId: string) => {
    if (!branchId || !academicYearId) {
      setClasses([]);
      setSelectedClass(""); // Clear class selection when branch/year changes
      return;
    }
    
    try {
      const response = await fetch(`/api/classes?branchId=${branchId}&academicYearId=${academicYearId}`);
      const data = await response.json();
      setClasses(data.classes || data.data || data || []);
      // Clear class selection when new classes are loaded
      setSelectedClass("");
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
      setSelectedClass("");
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add pagination
      params.append('page', p.toString());
      params.append('limit', '30');
      
      // Add filter parameters
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedAcademicYear) params.append('academicYearId', selectedAcademicYear);
      if (selectedClass) params.append('classId', selectedClass);
      
      // Add other query parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      console.log("🔍 Fetching assignments with filters:", {
        selectedBranch,
        selectedAcademicYear,
        selectedClass,
        url: `/api/student-assignments?${params}`
      });

      const response = await fetch(`/api/student-assignments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const assignmentsList = data.assignments || [];
        setAssignments(assignmentsList);
        setTotalCount(data.totalCount || assignmentsList.length);
      } else {
        console.error('Failed to fetch assignments:', data.error);
        toast.error('Failed to load student assignments');
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Error loading student assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedStudents = async () => {
    try {
      const response = await fetch('/api/unassigned-students');
      const data = await response.json();
      
      const studentsList = data.students || [];
      setUnassignedStudents(studentsList);
    } catch (error) {
      console.error('Error fetching unassigned students:', error);
      setUnassignedStudents([]);
    }
  };

  const fetchCurrentAcademicYear = async () => {
    try {
      const response = await fetch('/api/academic-years?current=true');
      const data = await response.json();
      
      if (data.academicYears && data.academicYears.length > 0) {
        const currentYear = data.academicYears.find((year: any) => year.isCurrent);
        setCurrentAcademicYear(currentYear || data.academicYears[0]);
      } else {
        setCurrentAcademicYear(null);
      }
    } catch (error) {
      console.error('Error fetching current academic year:', error);
      setCurrentAcademicYear(null);
    }
  };

  const clearFilters = () => {
    setSelectedBranch("");
    setSelectedAcademicYear("");
    setSelectedClass("");
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchClasses(selectedBranch, selectedAcademicYear);
  }, [selectedBranch, selectedAcademicYear]);

  useEffect(() => {
    fetchAssignments();
    fetchUnassignedStudents();
    fetchCurrentAcademicYear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedBranch, selectedAcademicYear, selectedClass]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Student Assignments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Branch Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName} - {branch.district}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isCurrent && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedBranch || !selectedAcademicYear}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">&nbsp;</label>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-100 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-800 font-medium">{unassignedStudents.length} Unassigned</span>
          </div>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-800 font-medium">{assignments.length} Assigned</span>
          </div>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading assignments...</span>
          </div>
        </div>
      ) : (
        <Table columns={columns} renderRow={(item) => renderRow(item, "admin")} data={assignments} />
      )}

      {/* PAGINATION */}
      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default StudentAssignmentsListPage;
