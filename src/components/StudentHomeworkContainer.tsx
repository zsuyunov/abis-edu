"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import StudentHomeworkList from "./StudentHomeworkList";
import StudentHomeworkSubmission from "./StudentHomeworkSubmission";
import StudentHomeworkFilters from "./StudentHomeworkFilters";

type ViewType = "list" | "submit" | "export";

interface StudentHomeworkContainerProps {
  studentId: string;
}

const StudentHomeworkContainer = ({ studentId }: StudentHomeworkContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    subjectId: "",
    status: "ALL",
    academicYearId: "",
    startDate: "",
    endDate: "",
  });

  const [studentData, setStudentData] = useState<any>(null);
  const [homeworkData, setHomeworkData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view !== "submit") {
      setSelectedHomeworkId(null);
    }
  };

  const handleHomeworkSelect = (homeworkId: number) => {
    setSelectedHomeworkId(homeworkId);
    setCurrentView("submit");
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDataUpdate = (data: any) => {
    setStudentData(data);
    setHomeworkData(data);
    setLoading(false);
  };

  const handleSubmissionComplete = () => {
    setCurrentView("list");
    // Refresh data
    fetchHomeworkData();
  };

  const fetchHomeworkData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        studentId,
        ...filters,
      });

      console.log('Fetching homework for student:', studentId);
      console.log('Query params:', queryParams.toString());
      
      const response = await fetch(`/api/student-homework?${queryParams}`, {
        headers: {
          'x-user-id': studentId,
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Student homework data received:', data);
        console.log('Homework count:', data.homework?.length || 0);
        console.log('Student info:', {
          id: data.student?.id,
          branchId: data.student?.branchId,
          classId: data.student?.classId,
          branch: data.student?.branch?.shortName,
          class: data.student?.class?.name
        });
        console.log('Available academic years:', data.availableAcademicYears);
        console.log('Available subjects:', data.availableSubjects);
        console.log('Stats:', data.stats);
        handleDataUpdate(data);
      } else {
        const error = await response.json();
        console.error('Failed to fetch student homework:', error);
        console.error('Response status:', response.status);
      }
    } catch (error) {
      console.error("Error fetching homework data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchHomeworkData();
    }
  }, [studentId, filters]);

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case "list":
        return "📚";
      case "submit":
        return "📝";
      case "export":
        return "📁";
      default:
        return "📖";
    }
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case "list":
        return "My Homework";
      case "submit":
        return "Submit Work";
      case "export":
        return "Export Report";
      default:
        return "Homework";
    }
  };

  if (loading && !studentData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📚</div>
        <div className="text-gray-600">Loading your homework...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4">
      {/* STUDENT INFO HEADER */}
      {studentData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Image src="/student.png" alt="Student" width={24} height={24} className="invert" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  {studentData.student.firstName} {studentData.student.lastName}
                </h3>
                <div className="text-sm text-green-700">
                  ID: {studentData.student.studentId} | Class: {studentData.student.class.name} | Branch: {studentData.student.branch.shortName}
                </div>
              </div>
            </div>
            
            {homeworkData.stats && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{homeworkData.stats.completionRate}%</div>
                  <div className="text-xs text-green-700">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{homeworkData.stats.onTimeRate}%</div>
                  <div className="text-xs text-blue-700">On-Time Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{homeworkData.stats.totalHomework}</div>
                  <div className="text-xs text-purple-700">Total Homework</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOTIVATIONAL BANNER */}
      {studentData?.motivationalData && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="font-semibold text-orange-900">
                  {studentData.motivationalData.currentStreak > 0 
                    ? `${studentData.motivationalData.currentStreak}-day streak!` 
                    : "Start your homework streak!"}
                </div>
                <div className="text-sm text-orange-700">
                  {studentData.motivationalData.encouragement[0] || "Complete homework on time to build your streak!"}
                </div>
              </div>
            </div>
            
            {studentData.motivationalData.badges.length > 0 && (
              <div className="flex items-center gap-2">
                {studentData.motivationalData.badges.slice(0, 3).map((badge: any) => (
                  <div
                    key={badge.id}
                    className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-lg"
                    title={badge.title}
                  >
                    {badge.icon}
                  </div>
                ))}
                {studentData.motivationalData.badges.length > 3 && (
                  <div className="text-sm text-orange-700 font-medium">
                    +{studentData.motivationalData.badges.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW SELECTOR */}
      <div className="flex items-center gap-1 sm:gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => handleViewChange("list")}
          className={`p-2 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "list"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="My Homework"
        >
          <span className="sm:hidden">{getViewIcon("list")}</span>
          <span className="hidden sm:inline">{getViewIcon("list")} {getViewTitle("list")}</span>
        </button>
        <button
          onClick={() => handleViewChange("export")}
          className={`p-2 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "export"
              ? "bg-cyan-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="Export Report"
        >
          <span className="sm:hidden">{getViewIcon("export")}</span>
          <span className="hidden sm:inline">{getViewIcon("export")} {getViewTitle("export")}</span>
        </button>
      </div>

      {/* FILTERS */}
      {currentView === "list" && studentData && (
        <StudentHomeworkFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          currentView={currentView}
          studentData={studentData}
          isMobile={isMobile}
        />
      )}

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "list" && (
          <StudentHomeworkList
            studentId={studentId}
            homeworkData={homeworkData}
            loading={loading}
            onHomeworkSelect={handleHomeworkSelect}
            onDataUpdate={handleDataUpdate}
          />
        )}
        
        {currentView === "submit" && (
          <StudentHomeworkSubmission
            studentId={studentId}
            selectedHomeworkId={selectedHomeworkId}
            onSubmissionComplete={handleSubmissionComplete}
            onCancel={() => handleViewChange("list")}
            isMobile={isMobile}
          />
        )}
        
        
        {currentView === "export" && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Personal Report</h3>
            <p className="text-gray-600 mb-4">
              Download your complete homework history and performance statistics.
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={() => window.open(`/api/student-homework/export?format=pdf&studentId=${studentId}`)}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs sm:text-sm"
                title="Download PDF Report"
              >
                <span className="sm:hidden">📄</span>
                <span className="hidden sm:inline">📄 Download PDF</span>
              </button>
              <button
                onClick={() => window.open(`/api/student-homework/export?format=excel&studentId=${studentId}`)}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs sm:text-sm"
                title="Download Excel Report"
              >
                <span className="sm:hidden">📊</span>
                <span className="hidden sm:inline">📊 Download Excel</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentHomeworkContainer;
