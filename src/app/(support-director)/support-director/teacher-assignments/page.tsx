"use client";

import { useState, useEffect } from "react";
import FormContainer from "@/components/FormContainer";

interface TeacherAssignment {
  id: string;
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
  branch: {
    shortName: string;
  };
  supervisedClass?: {
    name: string;
  };
}

const SupportDirectorTeacherAssignmentsPage = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [unassignedTeachers, setUnassignedTeachers] = useState<UnassignedTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [viewMode, setViewMode] = useState<"assignments" | "unassigned">("assignments");

  // Filter data
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetchFilterData();
    fetchAssignments();
    fetchUnassignedTeachers();
  }, [selectedAcademicYear, selectedSubject]);

  const fetchFilterData = async () => {
    try {
      const [academicYearsRes, subjectsRes] = await Promise.all([
        fetch("/api/support-director/academic-years"),
        fetch("/api/support-director/subjects"),
      ]);

      const academicYearsJson = await academicYearsRes.json();
      const subjectsJson = await subjectsRes.json();

      setAcademicYears(academicYearsJson.data ?? []);
      setSubjects(subjectsJson.data ?? []);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Support directors see only their branch - this will be handled by the API
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear);
      if (selectedSubject) params.append("subjectId", selectedSubject);

      const response = await fetch(`/api/teacher-assignments?${params}`);
      const data = await response.json();
      
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedTeachers = async () => {
    try {
      const response = await fetch(`/api/unassigned-teachers`);
      const data = await response.json();
      
      setUnassignedTeachers(data.teachers || []);
    } catch (error) {
      console.error("Error fetching unassigned teachers:", error);
    }
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
          <FormContainer table="teacherAssignment" type="create" />
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* CONTENT */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      )}

      {!loading && viewMode === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Assignments ({assignments.length})</h3>
          </div>
          
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No teacher assignments found for the selected filters.</p>
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
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.teacher.firstName} {assignment.teacher.lastName}
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
                        {assignment.subject.name}
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
                          <FormContainer table="teacherAssignment" type="delete" data={assignment} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          </div>
          
          {unassignedTeachers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">✅ All teachers are assigned!</div>
              <p className="text-gray-500">No unassigned teachers found in your branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedTeachers.map((teacher) => (
                <div key={teacher.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">ID: {teacher.teacherId}</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Unassigned
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <div>Branch: {teacher.branch.shortName}</div>
                    {teacher.supervisedClass && (
                      <div className="text-blue-600">
                        Supervisor of: {teacher.supervisedClass.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Open assignment form with this teacher pre-selected
                      console.log("Assign teacher:", teacher.id);
                    }}
                    className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Assign Teacher
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportDirectorTeacherAssignmentsPage;
