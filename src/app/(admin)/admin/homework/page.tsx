"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import HomeworkSubmissionChart from "@/components/charts/HomeworkSubmissionChart";
import HomeworkTrendsChart from "@/components/charts/HomeworkTrendsChart";
import { useCachedBranches, useCachedClasses, useCachedSubjects, useCachedTeachers } from "@/hooks/usePowerfulApi";

interface Homework {
  id: number;
  title: string;
  description?: string;
  assignedDate: string;
  dueDate: string;
  status: string;
  submissions: HomeworkSubmission[];
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
}

interface HomeworkSubmission {
  id: number;
  submissionDate?: string;
  status: string;
  grade?: number;
  feedback?: string;
  fileUrl?: string;
  fileName?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
}

interface HomeworkAnalytics {
  totalHomework: number;
  totalSubmissions: number;
  submissionStats: Record<string, number>;
  homeworkStatusStats: Record<string, number>;
  subjectStats: Record<string, number>;
  teacherStats: Record<string, number>;
  submissionTrends: Record<string, number>;
  gradeStats: {
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    totalGraded: number;
  };
  submissionRate: number;
  lateSubmissionRate: number;
  studentPerformance: Array<{
    student: {
      firstName: string;
      lastName: string;
      studentId: string;
    };
    totalAssigned: number;
    submitted: number;
    late: number;
    notSubmitted: number;
    graded: number;
    averageGrade: number;
  }>;
  homework: Homework[];
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
  subjects: { id: number; name: string }[];
  teachers: { id: string; firstName: string; lastName: string; teacherId: string; branchId: number }[];
}

const HomeworkManagementPage = () => {
  // ULTRA-INSTANT cached data hooks
  const { data: branchesData } = useCachedBranches();
  const { data: classesData } = useCachedClasses();
  const { data: subjectsData } = useCachedSubjects();
  const { data: teachersData } = useCachedTeachers();
  
  // Required filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  // Optional filter states
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [homeworkData, setHomeworkData] = useState<HomeworkAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedHomework, setExpandedHomework] = useState<number | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<number | null>(null);
  
  // Filtered data states
  const [filteredAcademicYears, setFilteredAcademicYears] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Get filter data from cached hooks
  const filterData = {
    branches: branchesData?.branches || [],
    academicYears: [], // Will be populated from classes
    classes: classesData?.classes || [],
    subjects: subjectsData?.subjects || [],
    teachers: teachersData?.teachers || [],
  };

  // Filter academic years based on selected branch
  useEffect(() => {
    if (selectedBranch && filterData.academicYears && filterData.classes) {
      // Get academic years that have classes in the selected branch
      const classesInBranch = filterData.classes.filter(
        (cls: any) => cls.branchId === parseInt(selectedBranch) && cls.status === "ACTIVE"
      );
      const academicYearIds = Array.from(new Set(classesInBranch.map((cls: any) => cls.academicYearId)));
      const filtered = filterData.academicYears.filter(
        (year: any) => academicYearIds.includes(year.id) && year.status === "ACTIVE"
      );
      setFilteredAcademicYears(filtered);
    } else {
      setFilteredAcademicYears([]);
    }
    setSelectedAcademicYear("");
  }, [selectedBranch, filterData.academicYears, filterData.classes]);

  // Filter classes based on selected branch and academic year
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && filterData.classes) {
      const filtered = filterData.classes.filter(
        (cls: any) => 
          cls.branchId === parseInt(selectedBranch) && 
          cls.academicYearId === parseInt(selectedAcademicYear) &&
          cls.status === "ACTIVE"
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
    setSelectedClass("");
  }, [selectedBranch, selectedAcademicYear, filterData.classes]);

  // Filter subjects based on selected class
  useEffect(() => {
    if (selectedClass && filterData.subjects) {
      // In a real system, you might have subject-class relationships
      // For now, show all active subjects
      const filtered = filterData.subjects.filter(
        (subject: any) => subject.status === "ACTIVE"
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
    setSelectedSubject("");
  }, [selectedClass, filterData.subjects]);

  // Filter teachers based on selected branch
  useEffect(() => {
    if (selectedBranch && filterData.teachers) {
      const filtered = filterData.teachers.filter(
        (teacher: any) => teacher.branchId === parseInt(selectedBranch) && teacher.status === "ACTIVE"
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers([]);
    }
    setSelectedTeacher("");
  }, [selectedBranch, filterData.teachers]);

  // Fetch homework data when filters change
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && selectedClass && selectedSubject) {
      fetchHomeworkData();
    } else {
      setHomeworkData(null);
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, selectedTeacher, selectedStatus, dateRange, startDate, endDate]);

  const fetchHomeworkData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("branchId", selectedBranch);
      params.append("academicYearId", selectedAcademicYear);
      params.append("classId", selectedClass);
      params.append("subjectId", selectedSubject);
      if (selectedTeacher) params.append("teacherId", selectedTeacher);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (dateRange !== "ALL") params.append("dateRange", dateRange);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/homework/analytics?${params}`);
      const analyticsData = await response.json();

      setHomeworkData(analyticsData);
    } catch (error) {
      console.error("Error fetching homework data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "EXPIRED": return "bg-red-100 text-red-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED": return "bg-green-100 text-green-800";
      case "LATE": return "bg-yellow-100 text-yellow-800";
      case "NOT_SUBMITTED": return "bg-red-100 text-red-800";
      case "GRADED": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const exportReport = async () => {
    if (!canShowData) return;
    
    try {
      const params = new URLSearchParams();
      params.append("branchId", selectedBranch);
      params.append("academicYearId", selectedAcademicYear);
      params.append("classId", selectedClass);
      params.append("subjectId", selectedSubject);
      if (selectedTeacher) params.append("teacherId", selectedTeacher);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      params.append("format", "csv");

      const response = await fetch(`/api/homework/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `homework_export_${new Date().toISOString().split('T')[0]}.csv`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting homework:", error);
    }
  };

  const exportStudentDetails = async () => {
    if (!canShowData) return;
    
    try {
      const params = new URLSearchParams();
      params.append("branchId", selectedBranch);
      params.append("academicYearId", selectedAcademicYear);
      params.append("classId", selectedClass);
      params.append("subjectId", selectedSubject);
      if (selectedTeacher) params.append("teacherId", selectedTeacher);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      params.append("format", "student");

      const response = await fetch(`/api/homework/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `homework_students_export_${new Date().toISOString().split('T')[0]}.csv`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting student details:", error);
    }
  };

  const canShowData = selectedBranch && selectedAcademicYear && selectedClass && selectedSubject;

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Homework Management</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              showAnalytics 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Image src="/chart.png" alt="analytics" width={16} height={16} />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              disabled={!canShowData}
              title="Export homework summary"
            >
              <Image src="/export.png" alt="export" width={16} height={16} />
              Export Summary
            </button>
            <button 
              onClick={exportStudentDetails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!canShowData}
              title="Export student-level details"
            >
              <Image src="/export.png" alt="export" width={16} height={16} />
              Export Students
            </button>
          </div>
        </div>
      </div>

      {/* REQUIRED FILTERS */}
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-red-800">Required Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Branch *</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-red-300 rounded-md text-sm"
              required
            >
              <option value="">Select Branch</option>
              {filterData.branches?.map((branch: { id: number; shortName: string }) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              )) || null}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Academic Year *</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-red-300 rounded-md text-sm"
              disabled={!selectedBranch}
              required
            >
              <option value="">Select Academic Year</option>
              {filteredAcademicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-red-300 rounded-md text-sm"
              disabled={!selectedAcademicYear}
              required
            >
              <option value="">Select Class</option>
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Subject *</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-red-300 rounded-md text-sm"
              disabled={!selectedClass}
              required
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* OPTIONAL FILTERS */}
      {canShowData && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Optional Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Teachers</option>
                {filteredTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
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
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
                <option value="TERM">This Term</option>
                <option value="YEAR">This Year</option>
              </select>
            </div>
          </div>

          {dateRange === "ALL" && (
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
          )}
        </div>
      )}

      {/* MAIN CONTENT */}
      {!canShowData ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Image src="/homework.png" alt="homework" width={64} height={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Required Filters</h3>
            <p className="text-gray-600">
              Please select a branch, academic year, class, and subject to view homework data and analytics.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading homework data...</p>
        </div>
      ) : homeworkData ? (
        <div className="space-y-6">
          {/* ANALYTICS DASHBOARD */}
          {showAnalytics && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{homeworkData.totalHomework}</div>
                  <div className="text-sm text-blue-700">Total Homework</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{homeworkData.submissionRate}%</div>
                  <div className="text-sm text-green-700">Submission Rate</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{homeworkData.gradeStats.averageGrade}</div>
                  <div className="text-sm text-purple-700">Average Grade</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{homeworkData.lateSubmissionRate}%</div>
                  <div className="text-sm text-orange-700">Late Submissions</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HomeworkSubmissionChart 
                  data={homeworkData.submissionStats}
                  totalSubmissions={homeworkData.totalSubmissions}
                />
                <div className="lg:col-span-1">
                  <HomeworkTrendsChart 
                    submissionTrends={homeworkData.submissionTrends}
                    subjectStats={homeworkData.subjectStats}
                    totalHomework={homeworkData.totalHomework}
                  />
                </div>
              </div>
            </div>
          )}

          {/* HOMEWORK LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Homework Overview ({homeworkData.homework.length})</h3>
            </div>
            
            {homeworkData.homework.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No homework found for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {homeworkData.homework.map((homework) => (
                  <div key={homework.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedHomework(
                        expandedHomework === homework.id ? null : homework.id
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{homework.title}</h4>
                            <p className="text-sm text-gray-600">
                              {homework.teacher.firstName} {homework.teacher.lastName} • {homework.subject.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Assigned: {formatDate(homework.assignedDate)} • Due: {formatDate(homework.dueDate)}
                              {isOverdue(homework.dueDate) && (
                                <span className="ml-2 text-red-600 font-medium">OVERDUE</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(homework.status)}`}>
                              {homework.status}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {homework.submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length} / {homework.submissions.length} submitted
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {Math.round((homework.submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length / homework.submissions.length) * 100)}%
                            </div>
                            <div className="text-xs text-gray-500">Completion</div>
                          </div>

                          <Image 
                            src="/down.png" 
                            alt="expand" 
                            width={16} 
                            height={16}
                            className={`transition-transform ${
                              expandedHomework === homework.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {expandedHomework === homework.id && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Homework Details */}
                          <div>
                            <h5 className="font-medium mb-3">Homework Details</h5>
                            <div className="space-y-3">
                              {homework.description && (
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Description:</label>
                                  <p className="text-sm text-gray-600 mt-1">{homework.description}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Total Students:</label>
                                  <p className="text-sm text-gray-600">{homework.submissions.length}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Submitted:</label>
                                  <p className="text-sm text-green-600 font-medium">
                                    {homework.submissions.filter(s => s.status === "SUBMITTED" || s.status === "GRADED").length}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Late:</label>
                                  <p className="text-sm text-yellow-600 font-medium">
                                    {homework.submissions.filter(s => s.status === "LATE").length}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Not Submitted:</label>
                                  <p className="text-sm text-red-600 font-medium">
                                    {homework.submissions.filter(s => s.status === "NOT_SUBMITTED").length}
                                  </p>
                                </div>
                              </div>

                              {(() => {
                                const grades = homework.submissions
                                  .filter(s => s.grade !== null && s.grade !== undefined)
                                  .map(s => s.grade!);
                                
                                if (grades.length > 0) {
                                  const avgGrade = Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length * 100) / 100;
                                  const maxGrade = Math.max(...grades);
                                  const minGrade = Math.min(...grades);
                                  
                                  return (
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Average Grade:</label>
                                        <p className="text-sm text-blue-600 font-medium">{avgGrade}/100</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Highest:</label>
                                        <p className="text-sm text-green-600 font-medium">{maxGrade}/100</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-700">Lowest:</label>
                                        <p className="text-sm text-red-600 font-medium">{minGrade}/100</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            <button
                              onClick={() => setExpandedStudents(
                                expandedStudents === homework.id ? null : homework.id
                              )}
                              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <Image src="/view.png" alt="view" width={14} height={14} />
                              {expandedStudents === homework.id ? 'Hide' : 'View'} Student Details
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div>
                            <h5 className="font-medium mb-3">Actions</h5>
                            <div className="space-y-2">
                              <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                                <Image src="/view.png" alt="view" width={16} height={16} />
                                View Details
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm">
                                <Image src="/archive.png" alt="archive" width={16} height={16} />
                                Archive
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                                <Image src="/delete.png" alt="delete" width={16} height={16} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Student Submissions Detail */}
                        {expandedStudents === homework.id && (
                          <div className="mt-6 border-t pt-6">
                            <h5 className="font-medium mb-3">Individual Student Breakdown</h5>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {homework.submissions.map((submission) => (
                                    <tr key={submission.id}>
                                      <td className="px-4 py-2 text-sm">
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {submission.student.firstName} {submission.student.lastName}
                                          </div>
                                          <div className="text-gray-500">{submission.student.studentId}</div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSubmissionStatusBadge(submission.status)}`}>
                                          {submission.status.replace('_', ' ')}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {submission.submissionDate ? formatDate(submission.submissionDate) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        {submission.grade !== null && submission.grade !== undefined ? (
                                          <span className={`font-medium ${
                                            submission.grade >= 80 ? 'text-green-600' :
                                            submission.grade >= 60 ? 'text-yellow-600' : 'text-red-600'
                                          }`}>
                                            {submission.grade}/100
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {submission.feedback ? (
                                          <div className="max-w-xs truncate" title={submission.feedback}>
                                            {submission.feedback}
                                          </div>
                                        ) : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        {submission.fileName ? (
                                          <button className="text-blue-600 hover:text-blue-800 text-xs">
                                            {submission.fileName}
                                          </button>
                                        ) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No homework data available for the selected filters.</p>
        </div>
      )}
    </div>
  );
};

export default HomeworkManagementPage;
