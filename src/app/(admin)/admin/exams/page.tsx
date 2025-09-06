"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ExamForm from "@/components/forms/ExamForm";

interface Exam {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  fullMarks: number;
  passingMarks: number;
  status: string;
  teacher: {
    firstName: string;
    lastName: string;
    teacherId: string;
  };
  subject: {
    name: string;
  };
  class: {
    name: string;
  };
  branch: {
    shortName: string;
  };
  academicYear: {
    name: string;
  };
  examResults: Array<{
    marksObtained: number;
    status: string;
    student: {
      firstName: string;
      lastName: string;
      studentId: string;
    };
  }>;
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
  subjects: { id: number; name: string }[];
  teachers: { id: string; firstName: string; lastName: string; teacherId: string; branchId: number }[];
}

const ExamsManagementPage = () => {
  const [filterData, setFilterData] = useState<FilterData>({
    branches: [],
    academicYears: [],
    classes: [],
    subjects: [],
    teachers: [],
  });

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedExam, setExpandedExam] = useState<number | null>(null);

  // Modal states
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Filtered data states
  const [filteredAcademicYears, setFilteredAcademicYears] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);

  // Fetch initial filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [branchesRes, academicYearsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/academic-years"),
          fetch("/api/classes"),
          fetch("/api/subjects"),
          fetch("/api/teachers"),
        ]);

        const branchesJson = await branchesRes.json();
        const academicYearsJson = await academicYearsRes.json();
        const classesJson = await classesRes.json();
        const subjectsJson = await subjectsRes.json();
        const teachersJson = await teachersRes.json();

        const branches = branchesJson.branches ?? branchesJson.data ?? [];
        const academicYears = academicYearsJson.academicYears ?? academicYearsJson.data ?? [];
        const classes = classesJson.classes ?? classesJson.data ?? [];
        const subjects = subjectsJson.subjects ?? subjectsJson.data ?? [];
        const teachers = teachersJson.teachers ?? teachersJson.data?.teachers ?? [];

        setFilterData({ branches, academicYears, classes, subjects, teachers });
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    fetchFilterData();
  }, []);

  // Fetch exams when filters change
  useEffect(() => {
    fetchExams();
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, selectedTeacher, selectedStatus, startDate, endDate]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append("branchId", selectedBranch);
      if (selectedAcademicYear) params.append("academicYearId", selectedAcademicYear);
      if (selectedClass) params.append("classId", selectedClass);
      if (selectedSubject) params.append("subjectId", selectedSubject);
      if (selectedTeacher) params.append("teacherId", selectedTeacher);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/exams?${params}`);
      const examsData = await response.json();

      setExams(examsData);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = () => {
    setEditingExam(null);
    setShowExamForm(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setShowExamForm(true);
  };

  const handleFormSuccess = () => {
    fetchExams();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const isUpcoming = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return examDate >= today && examDate <= nextWeek;
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Exams Management</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCreateExam}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Image src="/plus.png" alt="add" width={16} height={16} />
            Create Exam
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Branches</option>
              {filterData.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
              {filterData.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading exams...</p>
        </div>
      )}

      {/* EXAMS LIST */}
      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Exams ({exams.length})</h3>
          </div>
          
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No exams found for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div key={exam.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedExam(
                      expandedExam === exam.id ? null : exam.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                          <p className="text-sm text-gray-600">
                            {exam.subject.name} • {exam.teacher.firstName} {exam.teacher.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(exam.date)} • {exam.startTime} - {exam.endTime} • Room {exam.roomNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(exam.status)}`}>
                            {exam.status}
                          </span>
                          {isUpcoming(exam.date) && exam.status === "SCHEDULED" && (
                            <div className="text-xs text-orange-600 mt-1">
                              📅 Upcoming
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {exam.fullMarks}
                          </div>
                          <div className="text-xs text-gray-500">Full Marks</div>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditExam(exam);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" 
                          title="Edit exam"
                        >
                          <Image src="/edit.png" alt="edit" width={16} height={16} />
                        </button>

                        <Image 
                          src="/down.png" 
                          alt="expand" 
                          width={16} 
                          height={16}
                          className={`transition-transform ${
                            expandedExam === exam.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {expandedExam === exam.id && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Exam Details */}
                        <div>
                          <h5 className="font-medium mb-3">Exam Details</h5>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Branch:</label>
                                <p className="text-sm text-gray-600">{exam.branch.shortName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Class:</label>
                                <p className="text-sm text-gray-600">{exam.class.name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Academic Year:</label>
                                <p className="text-sm text-gray-600">{exam.academicYear.name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Passing Marks:</label>
                                <p className="text-sm text-gray-600">{exam.passingMarks}/{exam.fullMarks}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Results Summary */}
                        <div>
                          <h5 className="font-medium mb-3">Results Summary</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">Total Students:</span>
                              <span className="text-sm font-medium">{exam.examResults.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">Passed:</span>
                              <span className="text-sm text-green-600 font-medium">
                                {exam.examResults.filter(r => r.status === "PASS").length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">Failed:</span>
                              <span className="text-sm text-red-600 font-medium">
                                {exam.examResults.filter(r => r.status === "FAIL").length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXAM FORM MODAL */}
      {showExamForm && (
        <ExamForm
          type={editingExam ? "update" : "create"}
          data={editingExam}
          onClose={() => setShowExamForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default ExamsManagementPage;
