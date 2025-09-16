"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ExamForm from "@/components/forms/ExamForm";
import { toast } from "react-toastify";

interface Exam {
  id: number;
  name: string;
  date: string;
  examDay?: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  fullMarks: number;
  passingMarks: number;
  status: string;
  archivedAt?: string;
  teacher?: {
    firstName: string;
    lastName: string;
    teacherId: string;
  };
  subject?: {
    name: string;
  };
  class: {
    name: string;
  };
  branch: {
    shortName: string;
    district: string;
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
  branches: { id: number; shortName: string; district: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
  subjects: { id: number; name: string }[];
  teachers: { id: string; firstName: string; lastName: string; teacherId: string }[];
}

// Helper function to format time from HH:MM:SS to 12-hour format
const formatTime = (timeString: string) => {
  if (!timeString) return '';
  
  
  // If it's already in 12-hour format (contains AM/PM), return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  // Handle different time formats
  let timeParts;
  if (timeString.includes('T')) {
    // Handle ISO datetime format
    const timeOnly = timeString.split('T')[1]?.split('.')[0] || timeString.split('T')[1]?.split('Z')[0];
    timeParts = timeOnly?.split(':');
  } else {
    // Handle HH:MM:SS format
    timeParts = timeString.split(':');
  }
  
  if (!timeParts || timeParts.length < 2) {
    console.warn('Invalid time format:', timeString);
    return timeString; // Return original if can't parse
  }
  
  const hour24 = parseInt(timeParts[0]);
  const min = parseInt(timeParts[1]);
  
  // Validate hour and minute values
  if (isNaN(hour24) || isNaN(min) || hour24 < 0 || hour24 > 23 || min < 0 || min > 59) {
    console.warn('Invalid time values:', { hour24, min, original: timeString });
    return timeString; // Return original if invalid
  }
  
  let hour12 = hour24;
  let period = 'AM';
  
  if (hour24 === 0) {
    hour12 = 12;
  } else if (hour24 === 12) {
    period = 'PM';
  } else if (hour24 > 12) {
    hour12 = hour24 - 12;
    period = 'PM';
  }
  
  return `${hour12}:${min.toString().padStart(2, '0')} ${period}`;
};

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
  const [viewingExam, setViewingExam] = useState<Exam | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [archiveComment, setArchiveComment] = useState("");
  const [deleteComment, setDeleteComment] = useState("");

  // Fetch initial filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [branchesRes, academicYearsRes, subjectsRes, teachersRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/academic-years"),
          fetch("/api/subjects"),
          fetch("/api/teachers"),
        ]);

        const [branchesJson, academicYearsJson, subjectsJson, teachersJson] = await Promise.all([
          branchesRes.json(),
          academicYearsRes.json(),
          subjectsRes.json(),
          teachersRes.json(),
        ]);

        const branches = branchesJson.branches ?? branchesJson.data ?? [];
        const academicYears = academicYearsJson.academicYears ?? academicYearsJson.data ?? [];
        const subjects = subjectsJson.subjects ?? subjectsJson.data ?? [];
        const teachers = teachersJson.teachers ?? teachersJson.data?.teachers ?? [];

        setFilterData({ branches, academicYears, classes: [], subjects, teachers });
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

  const handleViewExam = (exam: Exam) => {
    setViewingExam(exam);
    setShowViewModal(true);
  };

  const handleArchiveExam = (exam: Exam) => {
    setSelectedExam(exam);
    setArchiveComment("");
    setShowArchiveModal(true);
  };

  const handleRestoreExam = async (exam: Exam) => {
    try {
      const response = await fetch(`/api/exams/${exam.id}/restore`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'restore' }),
      });

      if (response.ok) {
        toast.success('Exam restored successfully!');
        fetchExams();
      } else {
        toast.error('Failed to restore exam');
      }
    } catch (error) {
      console.error('Error restoring exam:', error);
      toast.error('Failed to restore exam');
    }
  };

  const handleDeleteExam = (exam: Exam) => {
    setSelectedExam(exam);
    setDeleteComment("");
    setShowDeleteModal(true);
  };

  const confirmArchive = async () => {
    if (!selectedExam || !archiveComment.trim()) {
      toast.error('Please provide a comment for archiving');
      return;
    }

    if (archiveComment.length < 10) {
      toast.error('Comment must be at least 10 characters long');
      return;
    }

    try {
      const response = await fetch(`/api/exams/${selectedExam.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'archive',
          comment: archiveComment,
          createdBy: 'admin' // You might want to get this from auth context
        }),
      });

      if (response.ok) {
        toast.success('Exam archived successfully!');
        fetchExams();
        setShowArchiveModal(false);
        setArchiveComment("");
        setSelectedExam(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to archive exam');
      }
    } catch (error) {
      console.error('Error archiving exam:', error);
      toast.error('Failed to archive exam');
    }
  };

  const confirmDelete = async () => {
    if (!selectedExam || !deleteComment.trim()) {
      toast.error('Please provide a comment for deletion');
      return;
    }

    if (deleteComment.length < 10) {
      toast.error('Comment must be at least 10 characters long');
      return;
    }

    try {
      const response = await fetch(`/api/exams/${selectedExam.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          comment: deleteComment,
          createdBy: 'admin' // You might want to get this from auth context
        }),
      });

      if (response.ok) {
        toast.success('Exam deleted successfully!');
        fetchExams();
        setShowDeleteModal(false);
        setDeleteComment("");
        setSelectedExam(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete exam');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    }
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-500 transition-colors"
          >
            <Image src="/create.png" alt="add" width={16} height={16} />
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
                  {branch.shortName} - {branch.district}
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
                    className="bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                          <p className="text-sm text-gray-600">
                            {exam.subject?.name || 'No Subject'} • {exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : 'No Teacher'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(exam.date)} • {formatTime(exam.startTime)} - {formatTime(exam.endTime)} • {exam.roomNumber}
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

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewExam(exam);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" 
                            title="View exam details"
                          >
                            <Image src="/view.png" alt="view" width={16} height={16} />
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditExam(exam);
                            }}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-full" 
                            title="Edit exam"
                          >
                            <Image src="/update.png" alt="edit" width={16} height={16} />
                          </button>

                          {exam.archivedAt ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreExam(exam);
                              }}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-full" 
                              title="Restore exam"
                            >
                              <Image src="/restore.png" alt="restore" width={16} height={16} />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveExam(exam);
                              }}
                              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full" 
                              title="Archive exam"
                            >
                              <Image src="/archive.png" alt="archive" width={16} height={16} />
                            </button>
                          )}

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExam(exam);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full" 
                            title="Delete exam"
                          >
                            <Image src="/delete.png" alt="delete" width={16} height={16} />
                          </button>
                        </div>

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
                                <p className="text-sm text-gray-600">{exam.branch.shortName} - {exam.branch.district}</p>
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
                              <div>
                                <label className="text-sm font-medium text-gray-700">Exam Day:</label>
                                <p className="text-sm text-gray-600">{exam.examDay || 'Not specified'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Room:</label>
                                <p className="text-sm text-gray-600">{exam.roomNumber}</p>
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

      {/* EXAM VIEW MODAL */}
      {showViewModal && viewingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Exam Details</h2>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Image src="/close.png" alt="close" width={16} height={16} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Exam Name:</label>
                      <p className="text-sm text-gray-900">{viewingExam.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date:</label>
                      <p className="text-sm text-gray-900">{formatDate(viewingExam.date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Exam Day:</label>
                      <p className="text-sm text-gray-900">{viewingExam.examDay || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Time:</label>
                      <p className="text-sm text-gray-900">{formatTime(viewingExam.startTime)} - {formatTime(viewingExam.endTime)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Room:</label>
                      <p className="text-sm text-gray-900">{viewingExam.roomNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status:</label>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(viewingExam.status)}`}>
                        {viewingExam.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Branch:</label>
                      <p className="text-sm text-gray-900">{viewingExam.branch.shortName} - {viewingExam.branch.district}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Class:</label>
                      <p className="text-sm text-gray-900">{viewingExam.class.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Academic Year:</label>
                      <p className="text-sm text-gray-900">{viewingExam.academicYear.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Subject:</label>
                      <p className="text-sm text-gray-900">{viewingExam.subject?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Teacher:</label>
                      <p className="text-sm text-gray-900">
                        {viewingExam.teacher ? `${viewingExam.teacher.firstName} ${viewingExam.teacher.lastName} (${viewingExam.teacher.teacherId})` : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Marks Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Marks Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Marks:</label>
                      <p className="text-sm text-gray-900">{viewingExam.fullMarks}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Passing Marks:</label>
                      <p className="text-sm text-gray-900">{viewingExam.passingMarks}</p>
                    </div>
                  </div>
                </div>

                {/* Results Summary */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Results Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Statistics */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-800">Basic Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Total Students:</span>
                          <span className="text-sm font-medium">{viewingExam.examResults.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Passed:</span>
                          <span className="text-sm text-green-600 font-medium">
                            {viewingExam.examResults.filter(r => r.status === "PASS").length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Failed:</span>
                          <span className="text-sm text-red-600 font-medium">
                            {viewingExam.examResults.filter(r => r.status === "FAIL").length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Not Graded:</span>
                          <span className="text-sm text-gray-600 font-medium">
                            {viewingExam.examResults.filter(r => r.marksObtained === 0 || r.marksObtained === null).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Pass Rate:</span>
                          <span className="text-sm font-medium">
                            {viewingExam.examResults.length > 0 
                              ? Math.round((viewingExam.examResults.filter(r => r.status === "PASS").length / viewingExam.examResults.length) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Statistics */}
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-gray-800">Performance Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Average Score:</span>
                          <span className="text-sm font-medium">
                            {viewingExam.examResults.length > 0 
                              ? Math.round((viewingExam.examResults.reduce((sum, r) => sum + r.marksObtained, 0) / viewingExam.examResults.length) * 100) / 100
                              : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Highest Score:</span>
                          <span className="text-sm text-green-600 font-medium">
                            {viewingExam.examResults.length > 0 
                              ? Math.max(...viewingExam.examResults.map(r => r.marksObtained))
                              : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Lowest Score:</span>
                          <span className="text-sm text-red-600 font-medium">
                            {viewingExam.examResults.length > 0 
                              ? Math.min(...viewingExam.examResults.map(r => r.marksObtained))
                              : 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Submissions:</span>
                          <span className="text-sm font-medium">
                            {viewingExam.examResults.filter(r => r.marksObtained > 0).length} / {viewingExam.examResults.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditExam(viewingExam);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Edit Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Archive Exam</h2>
                <button 
                  onClick={() => setShowArchiveModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Image src="/close.png" alt="close" width={16} height={16} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to archive the exam "{selectedExam.name}"?
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for archiving <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={archiveComment}
                  onChange={(e) => setArchiveComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={4}
                  placeholder="Please provide a reason for archiving this exam (minimum 10 characters)..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {archiveComment.length}/10 characters minimum
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  disabled={archiveComment.length < 10}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Archive Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-red-600">Delete Exam</h2>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Image src="/close.png" alt="close" width={16} height={16} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to permanently delete the exam "{selectedExam.name}"?
                </p>
                <p className="text-red-600 text-sm mb-4 font-medium">
                  This action cannot be undone!
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteComment}
                  onChange={(e) => setDeleteComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={4}
                  placeholder="Please provide a reason for deleting this exam (minimum 10 characters)..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {deleteComment.length}/10 characters minimum
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteComment.length < 10}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Delete Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsManagementPage;