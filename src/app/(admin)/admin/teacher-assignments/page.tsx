"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FormContainer from "@/components/FormContainer";

// Utility to safely extract array from API responses that may return
// {data: [...]}, {assignments: [...]}, {teachers: [...]}, or direct array
const extractArray = <T,>(obj: any, possibleKeys: string[]): T[] => {
  if (Array.isArray(obj)) return obj as T[];
  for (const key of possibleKeys) {
    if (Array.isArray(obj?.[key])) return obj[key] as T[];
  }
  return [];
};

interface TeacherAssignment {
  id: string;
  role?: "SUPERVISOR" | "TEACHER";
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    teacherId: string;
  };
  class: {
    id: number;
    name: string;
    branch: {
      id: number;
      shortName: string;
    };
  };
  subject: {
    id: number;
    name: string;
  };
  academicYear: {
    id: number;
    name: string;
    isCurrent: boolean;
  };
  createdAt: string;
}

interface UnassignedTeacher {
  id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
  branch?: {
    id: number;
    shortName: string;
  };
  supervisedClass?: {
    name: string;
  };
}

const TeacherAssignmentsPage = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [unassignedTeachers, setUnassignedTeachers] = useState<UnassignedTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [viewMode, setViewMode] = useState<"assignments" | "unassigned">("assignments");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter data
  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  // Lazy-load the assignment form for Quick Assign
  const TeacherAssignmentForm = dynamic(() => import("@/components/forms/TeacherAssignmentForm"), {
    loading: () => <div className="p-6 text-center">Loading form...</div>,
    ssr: false,
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTeacher, setAssignTeacher] = useState<UnassignedTeacher | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    unassignedCount: 0,
    supervisorCount: 0
  });

  useEffect(() => {
    fetchFilterData();
    fetchAssignments();
    fetchUnassignedTeachers();

    const handler = () => {
      fetchAssignments();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('teacher-assignment-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('teacher-assignment-updated', handler);
      }
    };
  }, [selectedBranch, selectedAcademicYear, selectedSubject, selectedRole, query]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch, selectedAcademicYear, selectedSubject, selectedRole, query]);

  // Fetch assignments when page changes
  useEffect(() => {
    if (viewMode === "assignments") {
      fetchAssignments();
    }
  }, [currentPage]);

  const fetchFilterData = async () => {
    try {
      const [branchesRes, academicYearsRes, subjectsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/academic-years"),
        fetch("/api/subjects"),
      ]);

      const branchesJson = await branchesRes.json();
      const academicYearsJson = await academicYearsRes.json();
      const subjectsJson = await subjectsRes.json();

      setBranches(extractArray(branchesJson, ["branches", "data"]));
      setAcademicYears(extractArray(academicYearsJson, ["academicYears", "data"]));
      setSubjects(extractArray(subjectsJson, ["subjects", "data"]));
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear);
      if (selectedSubject) params.append("subjectId", selectedSubject);
      if (selectedRole) params.append("role", selectedRole);
      if (query.trim()) params.append("q", query.trim());
      
      // Add pagination parameters
      params.append("page", currentPage.toString());
      params.append("limit", "50");

      const response = await fetch(`/api/teacher-assignments?${params}`);
      const data = await response.json();
      
      setAssignments(extractArray(data, ["assignments", "data"]));
      
      // Update pagination state
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      // Calculate statistics
      const arrayData = extractArray(data, ["assignments", "data"]);
      const uniqueTeachers = new Set(arrayData.map((a: any) => a.teacher.id) || []);
      const uniqueClasses = new Set(arrayData.map((a: any) => a.class.id) || []);
      const uniqueSubjects = new Set(arrayData.map((a: any) => a.subject?.id).filter(Boolean) || []);
      
      setStats(prev => ({
        ...prev,
        totalAssignments: data.pagination?.totalCount || arrayData.length || 0,
        totalTeachers: uniqueTeachers.size,
        totalClasses: uniqueClasses.size,
        totalSubjects: uniqueSubjects.size
      }));
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedTeachers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);

      const response = await fetch(`/api/unassigned-teachers?${params}`);
      const data = await response.json();
      
      setUnassignedTeachers(extractArray(data, ["teachers", "data"]));
      
      // Count supervisors
      const teacherArr = extractArray(data, ["teachers", "data"]);
      const supervisorCount = teacherArr.filter((t: any) => t.supervisedClass).length || 0;
      setStats(prev => ({
        ...prev,
        unassignedCount: data.teachers?.length || 0,
        supervisorCount
      }));
    } catch (error) {
      console.error("Error fetching unassigned teachers:", error);
    }
  };

  const handleQuickAssign = (teacher: UnassignedTeacher) => {
    // TODO: Open assignment form with this teacher pre-selected
    console.log("Quick assign teacher:", teacher.id);
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Teacher Assignments</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("assignments")}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === "assignments"
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setViewMode("unassigned")}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === "unassigned"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unassigned ({unassignedTeachers.length})
            </button>
          </div>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalAssignments}</div>
          <div className="text-xs text-blue-600">Total Assignments</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalTeachers}</div>
          <div className="text-xs text-green-600">Assigned Teachers</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalClasses}</div>
          <div className="text-xs text-purple-600">Active Classes</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.totalSubjects}</div>
          <div className="text-xs text-yellow-600">Subjects Taught</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.unassignedCount}</div>
          <div className="text-xs text-orange-600">Unassigned</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.supervisorCount}</div>
          <div className="text-xs text-indigo-600">Supervisors</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Advanced Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.isCurrent && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Roles</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Teacher</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or Teacher ID"
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedBranch("");
                setSelectedAcademicYear("");
                setSelectedSubject("");
                setSelectedRole("");
              }}
              className="w-full bg-gray-500 text-white p-2 rounded-md text-sm hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 mt-2">Loading assignments...</p>
        </div>
      )}

      {!loading && viewMode === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Assignments ({pagination.totalCount})</h3>
            <div className="text-sm text-gray-500">
              Showing {assignments.length} of {pagination.totalCount} assignments
            </div>
          </div>
          
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📚</div>
              <p className="text-gray-500">No teacher assignments found for the selected filters.</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or create new assignments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.teacher.firstName} {assignment.teacher.lastName}
                            </div>
                            {assignment.role && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${assignment.role === "SUPERVISOR" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                                {assignment.role === "SUPERVISOR" ? "Supervisor" : "Teacher"}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">ID: {assignment.teacher.teacherId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.class.name}</div>
                          <div className="text-sm text-gray-500">{assignment.class.branch.shortName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.subject ? assignment.subject.name : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assignment.academicYear.name}
                          {assignment.academicYear.isCurrent && (
                            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <FormContainer table="teacherAssignment" type="update" data={assignment} />
                          <FormContainer table="teacherAssignment" type="unassign" data={assignment} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {assignments.length > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.totalCount} total assignments)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && viewMode === "unassigned" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-orange-600">
              Unassigned Teachers ({unassignedTeachers.length})
            </h3>
            <div className="text-sm text-gray-500">
              {stats.supervisorCount} are class supervisors
            </div>
          </div>
          
          {unassignedTeachers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">✅ All teachers are assigned!</div>
              <p className="text-gray-500">No unassigned teachers found for the selected branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedTeachers.map((teacher) => (
                <div key={teacher.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50 hover:bg-orange-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">ID: {teacher.teacherId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Unassigned
                      </span>
                      {teacher.supervisedClass && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Supervisor
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <div>Branch: {teacher.branch?.shortName || "-"}</div>
                    {teacher.supervisedClass && (
                      <div className="text-blue-600 font-medium">
                        Supervises: {teacher.supervisedClass.name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAssignTeacher(teacher);
                        setShowAssignModal(true);
                      }}
                      className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Quick Assign
                    </button>
                    <button
                      onClick={() => router.push(`/admin/list/teachers/${teacher.id}`)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAssignModal && assignTeacher && (
        <div className="w-screen h-screen fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <TeacherAssignmentForm type="create" data={assignTeacher} setOpen={setShowAssignModal} />
            <div className="absolute top-4 right-4 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-full p-2 z-10" onClick={() => setShowAssignModal(false)}>
              <Image src="/close.png" alt="" width={16} height={16} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentsPage;
