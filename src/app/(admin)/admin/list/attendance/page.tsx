"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface StudentAttendanceStats {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  presentPercentage: number;
  absentPercentage: number;
  latePercentage: number;
  excusedPercentage: number;
  attendanceRecords: any[];
}

interface ClassSummary {
  totalStudents: number;
  totalSessions: number;
  totalPossibleSessions: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  presentPercentage: number;
  absentPercentage: number;
  latePercentage: number;
  excusedPercentage: number;
}

interface AttendanceData {
  studentStats: StudentAttendanceStats[];
  classSummary: ClassSummary;
  timetables: any[];
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
  subjects: { id: number; name: string }[];
}

const AttendancePage = () => {
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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

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
      // Get subjects that have timetables for this class
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

  // Fetch attendance statistics when all filters are selected
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && selectedClass && selectedSubject) {
      fetchAttendanceStatistics();
    } else {
      setAttendanceData(null);
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, selectedSubject, startDate, endDate]);

  const fetchAttendanceStatistics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch,
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        subjectId: selectedSubject,
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/attendance/statistics?${params}`);
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PRESENT: "bg-green-100 text-green-800",
      ABSENT: "bg-red-100 text-red-800", 
      LATE: "bg-yellow-100 text-yellow-800",
      EXCUSED: "bg-blue-100 text-blue-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
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
        <h1 className="text-xl font-semibold">Attendance Management</h1>
        <div className="flex items-center gap-2">
          {attendanceData && (
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
        <h2 className="text-lg font-semibold mb-4">Filter Attendance</h2>
        
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

        {/* Optional Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={fetchAttendanceStatistics}
              disabled={!selectedBranch || !selectedAcademicYear || !selectedClass || !selectedSubject}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load Attendance"}
            </button>
          </div>
        </div>
      </div>

      {/* CLASS SUMMARY */}
      {attendanceData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Class Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {attendanceData.classSummary.presentPercentage}%
              </div>
              <div className="text-sm text-gray-600">Present</div>
              <div className="text-xs text-gray-500">
                {attendanceData.classSummary.totalPresent} sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {attendanceData.classSummary.absentPercentage}%
              </div>
              <div className="text-sm text-gray-600">Absent</div>
              <div className="text-xs text-gray-500">
                {attendanceData.classSummary.totalAbsent} sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {attendanceData.classSummary.latePercentage}%
              </div>
              <div className="text-sm text-gray-600">Late</div>
              <div className="text-xs text-gray-500">
                {attendanceData.classSummary.totalLate} sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {attendanceData.classSummary.excusedPercentage}%
              </div>
              <div className="text-sm text-gray-600">Excused</div>
              <div className="text-xs text-gray-500">
                {attendanceData.classSummary.totalExcused} sessions
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600 text-center">
            Total Students: {attendanceData.classSummary.totalStudents} | 
            Total Sessions: {attendanceData.classSummary.totalSessions} |
            Total Possible Sessions: {attendanceData.classSummary.totalPossibleSessions}
          </div>
        </div>
      )}

      {/* STUDENT ATTENDANCE TABLE */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading attendance data...</p>
        </div>
      )}

      {!loading && !attendanceData && selectedSubject && (
        <div className="text-center py-8">
          <p className="text-gray-500">No attendance data found for the selected filters.</p>
        </div>
      )}

      {!loading && attendanceData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Student Attendance</h3>
          
          {attendanceData.studentStats.map((studentStat) => (
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
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {studentStat.presentPercentage}%
                        </div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          {studentStat.absentPercentage}%
                        </div>
                        <div className="text-xs text-gray-500">Absent</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">
                          {studentStat.latePercentage}%
                        </div>
                        <div className="text-xs text-gray-500">Late</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {studentStat.excusedPercentage}%
                        </div>
                        <div className="text-xs text-gray-500">Excused</div>
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
                  <h5 className="font-medium mb-3">Detailed Attendance Records</h5>
                  
                  {studentStat.attendanceRecords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {studentStat.attendanceRecords.map((record) => (
                        <div key={record.id} className="bg-white border border-gray-200 rounded-md p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium">
                              {formatDate(record.date)}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(record.status)}`}>
                              {record.status}
                            </span>
                          </div>
                          {record.notes && (
                            <div className="text-xs text-gray-600 mt-1">
                              Note: {record.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No attendance records found.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
