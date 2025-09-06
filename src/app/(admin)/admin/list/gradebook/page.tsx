"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import GradeDistributionChart from "@/components/charts/GradeDistributionChart";
import ClassAverageChart from "@/components/charts/ClassAverageChart";
import PerformanceComparisonChart from "@/components/charts/PerformanceComparisonChart";
import StudentProgressChart from "@/components/charts/StudentProgressChart";
import ExamTrendChart from "@/components/charts/ExamTrendChart";
import ExamDifficultyChart from "@/components/charts/ExamDifficultyChart";

interface StudentGradeStats {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  totalGrades: number;
  averages: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
    termly: number | null;
    yearly: number | null;
    examMidterm: number | null;
    examFinal: number | null;
    examNational: number | null;
  };
  overallAverage: number | null;
  gradesByType: any;
  grades: any[];
  recentTrend: Array<{
    date: Date;
    value: number;
    type: string;
  }>;
}

interface ClassSummary {
  totalStudents: number;
  totalGrades: number;
  classAverage: number;
  highestPerformer: StudentGradeStats | null;
  lowestPerformer: StudentGradeStats | null;
  gradeDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
  };
}

interface GradebookData {
  studentStats: StudentGradeStats[];
  classSummary: ClassSummary;
  grades: any[];
}

interface ExamResult {
  examId: number;
  examName: string;
  examDate: string;
  examFullMarks: number;
  marksObtained: number;
  status: string;
  feedback: string;
}

interface StudentExamPerformance {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  examResults: ExamResult[];
  averagePerformance: number;
  totalExamsAttempted: number;
  passCount: number;
  failCount: number;
  consistentPerformer: string;
  trend: string;
}

interface ExamStatistics {
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
  statistics: {
    totalStudents: number;
    submissionsCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
    failPercentage: number;
    topPerformers: any[];
    bottomPerformers: any[];
  };
  examResults: any[];
}

interface ExamGradebookData {
  exams: ExamStatistics[];
  studentPerformance: StudentExamPerformance[];
  insights: {
    totalExams: number;
    totalStudents: number;
    overallClassAverage: number;
    subjectDifficulty: string;
    performanceTrends: any;
    atRiskStudents: StudentExamPerformance[];
    highPerformers: StudentExamPerformance[];
    examDifficultyRanking: any[];
  };
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
  subjects: { id: number; name: string }[];
}

const GradebookPage = () => {
  const [filterData, setFilterData] = useState<FilterData>({
    branches: [],
    academicYears: [],
    classes: [],
    subjects: [],
  });
  
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [gradeTypeFilter, setGradeTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [examGradebookData, setExamGradebookData] = useState<ExamGradebookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [expandedExam, setExpandedExam] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("grades");

  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);

  // Fetch initial filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [branchesRes, academicYearsRes, classesRes, subjectsRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/academic-years/active"),
          fetch("/api/classes"),
          fetch("/api/subjects"),
        ]);

        const branches = await branchesRes.json();
        const academicYears = await academicYearsRes.json();
        const classes = await classesRes.json();
        const subjects = await subjectsRes.json();

        setFilterData({ branches, academicYears, classes, subjects });
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    fetchFilterData();
  }, []);

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
  }, [selectedBranch, selectedAcademicYear, filterData.classes]);

  // Filter subjects based on selected class
  useEffect(() => {
    if (selectedClass && filterData.subjects) {
      const filtered = filterData.subjects.filter((subject: any) => subject.status === "ACTIVE");
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedClass, filterData.subjects]);

  // Clear dependent selections when parent changes
  useEffect(() => {
    setSelectedClass("");
  }, [selectedBranch, selectedAcademicYear]);

  useEffect(() => {
    setSelectedSubject("");
  }, [selectedClass]);

  // Fetch gradebook statistics when all filters are selected
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && selectedClass && selectedSubject) {
      if (activeTab === "grades") {
        fetchGradebookStatistics();
      } else if (activeTab === "exams") {
        fetchExamGradebookData();
      }
    } else {
      setGradebookData(null);
      setExamGradebookData(null);
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, gradeTypeFilter, startDate, endDate, activeTab]);

  const fetchGradebookStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch,
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        subjectId: selectedSubject,
      });

      if (gradeTypeFilter !== "ALL") params.append("gradeType", gradeTypeFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/grades/statistics?${params}`);
      const data = await response.json();
      setGradebookData(data);
    } catch (error) {
      console.error("Error fetching gradebook statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamGradebookData = async () => {
    setExamLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch,
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        subjectId: selectedSubject,
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/gradebook/exams?${params}`);
      const data = await response.json();
      setExamGradebookData(data);
    } catch (error) {
      console.error("Error fetching exam gradebook data:", error);
    } finally {
      setExamLoading(false);
    }
  };

  const getGradeBadge = (grade: number | null) => {
    if (grade === null) return { color: "bg-gray-100 text-gray-600", text: "N/A" };
    if (grade >= 90) return { color: "bg-green-100 text-green-800", text: `${grade}%` };
    if (grade >= 80) return { color: "bg-blue-100 text-blue-800", text: `${grade}%` };
    if (grade >= 70) return { color: "bg-yellow-100 text-yellow-800", text: `${grade}%` };
    return { color: "bg-red-100 text-red-800", text: `${grade}%` };
  };

  const handleExportExams = async (type: "summary" | "detailed") => {
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch,
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        subjectId: selectedSubject,
        format: "csv",
        type: type,
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/gradebook/exams/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = `exam-report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting exam data:", error);
    }
  };

  const formatGradeType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportClassReport = () => {
    // TODO: Implement Excel/PDF export for class
    console.log("Exporting class report...");
  };

  const exportStudentReport = (studentId: string) => {
    // TODO: Implement Excel/PDF export for student
    console.log(`Exporting report for student ${studentId}...`);
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Gradebook Management</h1>
        <div className="flex items-center gap-2">
          {gradebookData && (
            <button
              onClick={exportClassReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Image src="/export.png" alt="export" width={16} height={16} />
              Export Class Report
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Gradebook</h2>
        
        {/* Required Hierarchical Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Choose a branch</option>
              {filterData.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={!selectedBranch}
            >
              <option value="">Choose academic year</option>
              {filterData.academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={!selectedBranch || !selectedAcademicYear}
            >
              <option value="">Choose a class</option>
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={!selectedClass}
            >
              <option value="">Choose a subject</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade Type
            </label>
            <select
              value={gradeTypeFilter}
              onChange={(e) => setGradeTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="TERMLY">Termly</option>
              <option value="YEARLY">Yearly</option>
              <option value="EXAM_MIDTERM">Midterm Exam</option>
              <option value="EXAM_FINAL">Final Exam</option>
              <option value="EXAM_NATIONAL">National Exam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={activeTab === "grades" ? fetchGradebookStatistics : fetchExamGradebookData}
              disabled={!selectedBranch || !selectedAcademicYear || !selectedClass || !selectedSubject}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {(loading || examLoading) ? "Loading..." : activeTab === "grades" ? "Load Grades" : "Load Exams"}
            </button>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      {selectedBranch && selectedAcademicYear && selectedClass && selectedSubject && (
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "grades" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📊 Grades
            </button>
            <button
              onClick={() => setActiveTab("exams")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "exams" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📝 Exams
            </button>
          </div>
        </div>
      )}

      {/* GRADES TAB CONTENT */}
      {activeTab === "grades" && (
        <>
          {/* CLASS SUMMARY */}
          {gradebookData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Class Summary</h3>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {gradebookData.classSummary.classAverage}%
              </div>
              <div className="text-sm text-gray-600">Class Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {gradebookData.classSummary.gradeDistribution.excellent}
              </div>
              <div className="text-sm text-gray-600">Excellent (90%+)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {gradebookData.classSummary.gradeDistribution.good}
              </div>
              <div className="text-sm text-gray-600">Good (80-89%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {gradebookData.classSummary.gradeDistribution.satisfactory}
              </div>
              <div className="text-sm text-gray-600">Satisfactory (70-79%)</div>
            </div>
          </div>

          {/* Top and Bottom Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradebookData.classSummary.highestPerformer && (
              <div className="bg-green-100 p-3 rounded-md">
                <h4 className="font-semibold text-green-800 mb-1">Highest Performer</h4>
                <p className="text-sm">
                  {gradebookData.classSummary.highestPerformer.student.firstName}{" "}
                  {gradebookData.classSummary.highestPerformer.student.lastName}
                  <span className="font-semibold ml-2">
                    {gradebookData.classSummary.highestPerformer.overallAverage}%
                  </span>
                </p>
              </div>
            )}
            
            {gradebookData.classSummary.lowestPerformer && (
              <div className="bg-yellow-100 p-3 rounded-md">
                <h4 className="font-semibold text-yellow-800 mb-1">Needs Support</h4>
                <p className="text-sm">
                  {gradebookData.classSummary.lowestPerformer.student.firstName}{" "}
                  {gradebookData.classSummary.lowestPerformer.student.lastName}
                  <span className="font-semibold ml-2">
                    {gradebookData.classSummary.lowestPerformer.overallAverage}%
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHARTS SECTION */}
      {!loading && gradebookData && (
        <div className="space-y-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Analytics & Charts</h3>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Chart */}
            <GradeDistributionChart 
              data={gradebookData.classSummary.gradeDistribution}
              totalStudents={gradebookData.classSummary.totalStudents}
            />
            
            {/* Class Average by Grade Type Chart */}
            <ClassAverageChart 
              data={{
                daily: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.daily || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.daily !== null).length) || null
                  : null,
                weekly: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.weekly || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.weekly !== null).length) || null
                  : null,
                monthly: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.monthly || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.monthly !== null).length) || null
                  : null,
                termly: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.termly || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.termly !== null).length) || null
                  : null,
                yearly: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.yearly || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.yearly !== null).length) || null
                  : null,
                examMidterm: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.examMidterm || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.examMidterm !== null).length) || null
                  : null,
                examFinal: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.examFinal || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.examFinal !== null).length) || null
                  : null,
                examNational: gradebookData.studentStats.length > 0 
                  ? Math.round(gradebookData.studentStats.reduce((sum, s) => sum + (s.averages.examNational || 0), 0) / 
                    gradebookData.studentStats.filter(s => s.averages.examNational !== null).length) || null
                  : null,
              }}
              classAverage={gradebookData.classSummary.classAverage}
            />
          </div>

          {/* Performance Comparison Chart */}
          <PerformanceComparisonChart 
            studentStats={gradebookData.studentStats}
            classAverage={gradebookData.classSummary.classAverage}
          />
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading gradebook data...</p>
        </div>
      )}

      {/* NO DATA STATE */}
      {!loading && !gradebookData && selectedSubject && (
        <div className="text-center py-8">
          <p className="text-gray-500">No grade data found for the selected filters.</p>
        </div>
      )}

      {/* STUDENT GRADES TABLE */}
      {!loading && gradebookData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Student Grades</h3>
          
          {gradebookData.studentStats.map((studentStat) => (
            <div key={studentStat.student.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedStudent(
                  expandedStudent === studentStat.student.id ? null : studentStat.student.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {studentStat.student.firstName} {studentStat.student.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">ID: {studentStat.student.studentId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className={`px-2 py-1 rounded text-sm font-medium ${getGradeBadge(studentStat.averages.daily).color}`}>
                          {getGradeBadge(studentStat.averages.daily).text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Daily</div>
                      </div>
                      <div>
                        <div className={`px-2 py-1 rounded text-sm font-medium ${getGradeBadge(studentStat.averages.monthly).color}`}>
                          {getGradeBadge(studentStat.averages.monthly).text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Monthly</div>
                      </div>
                      <div>
                        <div className={`px-2 py-1 rounded text-sm font-medium ${getGradeBadge(studentStat.averages.examFinal).color}`}>
                          {getGradeBadge(studentStat.averages.examFinal).text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Final Exam</div>
                      </div>
                      <div>
                        <div className={`px-2 py-1 rounded text-sm font-bold ${getGradeBadge(studentStat.overallAverage).color}`}>
                          {getGradeBadge(studentStat.overallAverage).text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Overall</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportStudentReport(studentStat.student.id);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Export student report"
                      >
                        <Image src="/export.png" alt="export" width={16} height={16} />
                      </button>
                      <Image 
                        src="/down.png" 
                        alt="expand" 
                        width={16} 
                        height={16}
                        className={`transition-transform ${
                          expandedStudent === studentStat.student.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail View */}
              {expandedStudent === studentStat.student.id && (
                <div className="p-4 border-t border-gray-200">
                  <h5 className="font-medium mb-3">Detailed Grade Records</h5>
                  
                  {/* Grade Type Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {Object.entries(studentStat.averages).map(([type, average]) => (
                      <div key={type} className="bg-white border border-gray-200 rounded-md p-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {formatGradeType(type)}
                        </div>
                        <div className={`text-lg font-bold ${getGradeBadge(average).color.split(' ')[1]}`}>
                          {getGradeBadge(average).text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {studentStat.gradesByType[type]?.length || 0} grades
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Student Progress Chart */}
                  {studentStat.recentTrend.length > 0 && (
                    <div className="mb-6">
                      <StudentProgressChart 
                        data={studentStat.recentTrend}
                        studentName={`${studentStat.student.firstName} ${studentStat.student.lastName}`}
                      />
                    </div>
                  )}

                  {/* Recent Grades Timeline */}
                  {studentStat.grades.length > 0 && (
                    <div>
                      <h6 className="font-medium mb-2">Recent Grades</h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {studentStat.grades.slice(-6).map((grade) => (
                          <div key={grade.id} className="bg-white border border-gray-200 rounded-md p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-medium">
                                {new Intl.DateTimeFormat("en-US", {
                                  month: "short",
                                  day: "numeric",
                                }).format(new Date(grade.date))}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeBadge(Math.round(grade.value / grade.maxValue * 100)).color}`}>
                                {Math.round(grade.value / grade.maxValue * 100)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatGradeType(grade.type)}
                            </div>
                            {grade.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {grade.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* EXAMS TAB CONTENT */}
      {activeTab === "exams" && (
        <>
          {/* LOADING STATE */}
          {examLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading exam data...</p>
            </div>
          )}

          {/* NO DATA STATE */}
          {!examLoading && !examGradebookData && selectedSubject && (
            <div className="text-center py-8">
              <p className="text-gray-500">No exam data found for the selected filters.</p>
            </div>
          )}

          {/* EXAM INSIGHTS */}
          {examGradebookData && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3 text-green-800">Exam Insights</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {examGradebookData.insights.totalExams}
                  </div>
                  <div className="text-sm text-gray-600">Total Exams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {examGradebookData.insights.overallClassAverage}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {examGradebookData.insights.highPerformers.length}
                  </div>
                  <div className="text-sm text-gray-600">High Performers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {examGradebookData.insights.atRiskStudents.length}
                  </div>
                  <div className="text-sm text-gray-600">At-Risk Students</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Subject Difficulty:</p>
                  <p className={`text-lg font-bold ${
                    examGradebookData.insights.subjectDifficulty === "EASY" ? "text-green-600" :
                    examGradebookData.insights.subjectDifficulty === "MODERATE" ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {examGradebookData.insights.subjectDifficulty === "EASY" ? "😊 Easy" :
                     examGradebookData.insights.subjectDifficulty === "MODERATE" ? "😐 Moderate" : "😰 Difficult"}
                  </p>
                </div>
                
                {examGradebookData.insights.performanceTrends && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Performance Trends:</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">📈 {examGradebookData.insights.performanceTrends.improving} Improving</span>
                      <span className="text-red-600">📉 {examGradebookData.insights.performanceTrends.declining} Declining</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXAM CHARTS */}
          {examGradebookData && examGradebookData.exams.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ExamTrendChart 
                data={examGradebookData.exams.map(exam => ({
                  examName: exam.name,
                  date: exam.date,
                  averageScore: exam.statistics.averageScore,
                  passPercentage: exam.statistics.passPercentage,
                }))}
              />
              
              <ExamDifficultyChart 
                data={examGradebookData.insights.examDifficultyRanking}
              />
            </div>
          )}

          {/* EXAMS LIST */}
          {examGradebookData && examGradebookData.exams.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Exam Results ({examGradebookData.exams.length})</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportExams("summary")}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                  >
                    📊 Export Summary
                  </button>
                  <button
                    onClick={() => handleExportExams("detailed")}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                  >
                    📋 Export Details
                  </button>
                </div>
              </div>
              
              {examGradebookData.exams.map((exam) => (
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
                            {new Intl.DateTimeFormat("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(new Date(exam.date))} • {exam.startTime} - {exam.endTime} • Room {exam.roomNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            Teacher: {exam.teacher.firstName} {exam.teacher.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {exam.statistics.averageScore}%
                          </div>
                          <div className="text-xs text-gray-500">Average Score</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {exam.statistics.passPercentage}%
                          </div>
                          <div className="text-xs text-gray-500">Pass Rate</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-600">
                            {exam.fullMarks}
                          </div>
                          <div className="text-xs text-gray-500">Full Marks</div>
                        </div>

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

                  {/* Expanded Exam Details */}
                  {expandedExam === exam.id && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Exam Statistics */}
                        <div>
                          <h5 className="font-medium mb-3">Exam Statistics</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {exam.statistics.highestScore}
                              </div>
                              <div className="text-xs text-blue-700">Highest Score</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-red-600">
                                {exam.statistics.lowestScore}
                              </div>
                              <div className="text-xs text-red-700">Lowest Score</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-green-600">
                                {exam.statistics.passCount}
                              </div>
                              <div className="text-xs text-green-700">Passed</div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg text-center">
                              <div className="text-lg font-bold text-orange-600">
                                {exam.statistics.failCount}
                              </div>
                              <div className="text-xs text-orange-700">Failed</div>
                            </div>
                          </div>
                        </div>

                        {/* Top Performers */}
                        <div>
                          <h5 className="font-medium mb-3">Top Performers</h5>
                          <div className="space-y-2">
                            {exam.statistics.topPerformers.slice(0, 5).map((performer, index) => (
                              <div key={performer.student.id} className="flex items-center justify-between bg-green-50 p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-green-700">
                                    #{index + 1}
                                  </span>
                                  <span className="text-sm">
                                    {performer.student.firstName} {performer.student.lastName}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                  {performer.marksObtained}/{exam.fullMarks}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STUDENT EXAM PERFORMANCE */}
          {examGradebookData && examGradebookData.studentPerformance.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Student Exam Performance</h3>
              
              <div className="space-y-3">
                {examGradebookData.studentPerformance.map((studentPerf) => (
                  <div key={studentPerf.student.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedStudent(
                        expandedStudent === studentPerf.student.id ? null : studentPerf.student.id
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {studentPerf.student.firstName} {studentPerf.student.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ID: {studentPerf.student.studentId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {studentPerf.averagePerformance}%
                            </div>
                            <div className="text-xs text-gray-500">Average</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {studentPerf.passCount}
                            </div>
                            <div className="text-xs text-gray-500">Passed</div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {studentPerf.failCount}
                            </div>
                            <div className="text-xs text-gray-500">Failed</div>
                          </div>

                          <div className="text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              studentPerf.trend === "IMPROVING" ? "bg-green-100 text-green-800" :
                              studentPerf.trend === "DECLINING" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {studentPerf.trend === "IMPROVING" ? "📈 Improving" :
                               studentPerf.trend === "DECLINING" ? "📉 Declining" : "➡️ Stable"}
                            </span>
                          </div>

                          <Image 
                            src="/down.png" 
                            alt="expand" 
                            width={16} 
                            height={16}
                            className={`transition-transform ${
                              expandedStudent === studentPerf.student.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Student Exam Details */}
                    {expandedStudent === studentPerf.student.id && (
                      <div className="p-4 border-t border-gray-200">
                        <h5 className="font-medium mb-3">Individual Exam Results</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {studentPerf.examResults.map((result) => (
                            <div key={result.examId} className="bg-white border border-gray-200 rounded-md p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="text-sm font-medium">
                                  {result.examName}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.status === "PASS" ? "bg-green-100 text-green-800" :
                                  result.status === "FAIL" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {result.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                {new Intl.DateTimeFormat("en-US", {
                                  month: "short",
                                  day: "numeric",
                                }).format(new Date(result.examDate))}
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {result.marksObtained}/{result.examFullMarks}
                              </div>
                              <div className="text-sm text-gray-500">
                                {Math.round((result.marksObtained / result.examFullMarks) * 100)}%
                              </div>
                              {result.feedback && (
                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  <strong>Feedback:</strong> {result.feedback}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GradebookPage;
