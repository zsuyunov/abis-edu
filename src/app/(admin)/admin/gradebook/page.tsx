"use client";

import { useState, useEffect } from "react";
import { useLoading } from "@/components/providers/LoadingProvider";
import { useErrorToast, useSuccessToast } from "@/components/ui/Toast";
import { TableSkeleton, CardSkeleton, ChartSkeleton } from "@/components/ui/GlobalLoader";

interface GradeData {
  id: string;
  value: number;
  type: string;
  subject: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    name: string;
    surname: string;
    class: {
      id: string;
      name: string;
      level: number;
    };
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
  };
  date: string;
  comment?: string;
}

interface Branch {
  id: string;
  shortName: string;
  district: string;
}

interface AcademicYear {
  id: string;
  year: string;
  status: string;
}

interface Class {
  id: string;
  name: string;
  level: number;
  branchId: string;
  academicYearId: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function GradebookPage() {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [gradeType, setGradeType] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  
  // Statistics
  const [statistics, setStatistics] = useState<any>(null);

  const { showLoader, hideLoader } = useLoading();
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch grades when filters change
  useEffect(() => {
    if (branches.length > 0) {
      fetchGrades();
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, gradeType, dateRange]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [branchesRes, academicYearsRes, subjectsRes] = await Promise.all([
        fetch("/api/branches"),
        fetch("/api/academic-years"),
        fetch("/api/subjects"),
      ]);

      const [branchesData, academicYearsData, subjectsData] = await Promise.all([
        branchesRes.json(),
        academicYearsRes.json(),
        subjectsRes.json(),
      ]);

      setBranches(branchesData.branches || []);
      setAcademicYears(academicYearsData.academicYears || []);
      setSubjects(subjectsData.subjects || []);

      // Set default selections
      if (branchesData.branches?.length > 0) {
        setSelectedBranch(branchesData.branches[0].id);
      }
      if (academicYearsData.academicYears?.length > 0) {
        const activeYear = academicYearsData.academicYears.find((y: any) => y.status === "ACTIVE");
        setSelectedAcademicYear(activeYear?.id || academicYearsData.academicYears[0].id);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      errorToast("Error", "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes when branch or academic year changes
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear) {
      fetchClasses();
    }
  }, [selectedBranch, selectedAcademicYear]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(
        `/api/classes?branchId=${selectedBranch}&academicYearId=${selectedAcademicYear}`
      );
      const data = await response.json();
      setClasses(data.classes || []);
      setSelectedClass(""); // Reset class selection
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      setError(null);
      
      const params = new URLSearchParams({
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear }),
        ...(selectedClass && { classId: selectedClass }),
        ...(selectedSubject && { subjectId: selectedSubject }),
        ...(gradeType && { gradeType }),
        ...(dateRange.from && { startDate: dateRange.from }),
        ...(dateRange.to && { endDate: dateRange.to }),
        limit: "50",
      });

      const [gradesRes, statsRes] = await Promise.all([
        fetch(`/api/grades?${params}`),
        fetch(`/api/grades/statistics?${params}`),
      ]);

      if (!gradesRes.ok) {
        throw new Error("Failed to fetch grades");
      }

      const gradesData = await gradesRes.json();
      const statsData = await statsRes.json();

      setGrades(gradesData.data?.grades || []);
      setStatistics(statsData.data || null);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setError("Failed to fetch grades");
      errorToast("Error", "Failed to load grades");
    }
  };

  const getGradeColor = (value: number) => {
    if (value >= 90) return "text-green-600 bg-green-50";
    if (value >= 80) return "text-blue-600 bg-blue-50";
    if (value >= 70) return "text-yellow-600 bg-yellow-50";
    if (value >= 60) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getGradeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "exam":
        return "bg-purple-100 text-purple-800";
      case "quiz":
        return "bg-blue-100 text-blue-800";
      case "homework":
        return "bg-green-100 text-green-800";
      case "project":
        return "bg-orange-100 text-orange-800";
      case "participation":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableSkeleton rows={8} cols={6} />
          </div>
          <div>
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook Management</h1>
          <p className="text-gray-600 mt-1">
            View and analyze student grades across all subjects and classes
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Grades</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalGrades || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.averageGrade ? statistics.averageGrade.toFixed(1) : "0.0"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Grade</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.highestGrade || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passing Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.passingRate ? `${statistics.passingRate.toFixed(1)}%` : "0%"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName} ({branch.district})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year} {year.status === "ACTIVE" && "(Active)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Level {cls.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Type</label>
            <select
              value={gradeType}
              onChange={(e) => setGradeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="EXAM">Exam</option>
              <option value="QUIZ">Quiz</option>
              <option value="HOMEWORK">Homework</option>
              <option value="PROJECT">Project</option>
              <option value="PARTICIPATION">Participation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Grades</h3>
        </div>
        
        {error ? (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-2">Error loading grades</div>
            <button
              onClick={fetchGrades}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Try again
            </button>
          </div>
        ) : grades.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No grades found for the selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {grade.student.name} {grade.student.surname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.student.class.name} (Level {grade.student.class.level})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {grade.subject.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getGradeColor(grade.value)}`}>
                        {grade.value}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeTypeColor(grade.type)}`}>
                        {grade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grade.teacher.name} {grade.teacher.surname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
