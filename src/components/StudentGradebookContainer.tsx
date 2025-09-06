"use client";

import { useState, useEffect } from "react";
import StudentGradebookOverview from "./StudentGradebookOverview";
import StudentExamResults from "./StudentExamResults";
import StudentAnalyticsDashboard from "./StudentAnalyticsDashboard";
import StudentGradebookFilters from "./StudentGradebookFilters";
import StudentMobileGradebook from "./StudentMobileGradebook";

type ViewType = "overview" | "exams" | "analytics" | "mobile";
type TimeFilterType = "current" | "past";

interface StudentGradebookContainerProps {
  studentId: string;
}

const StudentGradebookContainer = ({ studentId }: StudentGradebookContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("current");
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    academicYearId: "",
    subjectId: "",
    gradeType: "",
    startDate: "",
    endDate: "",
  });

  const [studentData, setStudentData] = useState<any>(null);
  const [availableAcademicYears, setAvailableAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set default view for mobile
  useEffect(() => {
    if (isMobile && currentView !== "mobile") {
      setCurrentView("mobile");
    } else if (!isMobile && currentView === "mobile") {
      setCurrentView("overview");
    }
  }, [isMobile]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleTimeFilterChange = (filter: TimeFilterType) => {
    setTimeFilter(filter);
    // Reset academic year filter when switching between current/past
    setFilters(prev => ({ ...prev, academicYearId: "" }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleStudentDataUpdate = (data: any) => {
    setStudentData(data.student);
    setAvailableAcademicYears(data.availableAcademicYears || []);
    setSubjects(data.subjects || []);
  };

  return (
    <div className="bg-white rounded-md p-4">
      {/* CURRENT/PAST FILTER (TOP OF PAGE) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => handleTimeFilterChange("current")}
              className={`px-6 py-2 text-sm font-medium ${
                timeFilter === "current"
                  ? "bg-lamaSky text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Current Year
            </button>
            <button
              onClick={() => handleTimeFilterChange("past")}
              className={`px-6 py-2 text-sm font-medium ${
                timeFilter === "past"
                  ? "bg-lamaSky text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Past Years
            </button>
          </div>
          
          {studentData && (
            <div className="text-sm text-gray-600">
              Student: {studentData.firstName} {studentData.lastName} ({studentData.studentId})
            </div>
          )}
        </div>

        {timeFilter === "past" && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            📚 Archived Records
          </div>
        )}
      </div>

      {/* VIEW SELECTOR (DESKTOP) */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleViewChange("overview")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "overview"
                  ? "bg-lamaSky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📊 Grade Overview
            </button>
            <button
              onClick={() => handleViewChange("exams")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "exams"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🎯 Exam Results
            </button>
            <button
              onClick={() => handleViewChange("analytics")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "analytics"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📈 Performance Analytics
            </button>
          </div>
        </div>
      )}

      {/* MOBILE VIEW SELECTOR */}
      {isMobile && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => handleViewChange("mobile")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "mobile"
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📱 Quick View
          </button>
          <button
            onClick={() => handleViewChange("overview")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "overview"
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📊 Grades
          </button>
          <button
            onClick={() => handleViewChange("exams")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "exams"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🎯 Exams
          </button>
          <button
            onClick={() => handleViewChange("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "analytics"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📈 Analytics
          </button>
        </div>
      )}

      {/* FILTERS */}
      {currentView !== "mobile" && (
        <StudentGradebookFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          currentView={currentView}
          timeFilter={timeFilter}
          availableAcademicYears={availableAcademicYears}
          subjects={subjects}
          isMobile={isMobile}
          studentId={studentId}
          onStudentDataUpdate={handleStudentDataUpdate}
        />
      )}

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "mobile" && isMobile && (
          <StudentMobileGradebook
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "overview" && (
          <StudentGradebookOverview
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "exams" && (
          <StudentExamResults
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
        
        {currentView === "analytics" && (
          <StudentAnalyticsDashboard
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            onStudentDataUpdate={handleStudentDataUpdate}
          />
        )}
      </div>

      {/* STUDENT GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Academic Guidance
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          {currentView === "overview" && (
            <>
              <div>• Track your grades across different subjects and time periods</div>
              <div>• Use filters to focus on specific subjects or grade types</div>
              <div>• Export your academic report for sharing with parents</div>
            </>
          )}
          {currentView === "exams" && (
            <>
              <div>• Review all your exam results and teacher feedback</div>
              <div>• Focus on exams where you can improve for better future performance</div>
              <div>• Read teacher feedback carefully to understand areas for improvement</div>
            </>
          )}
          {currentView === "analytics" && (
            <>
              <div>• Monitor your academic progress trends over time</div>
              <div>• Identify your strongest and weakest subjects</div>
              <div>• Use insights to plan your study time more effectively</div>
              <div>• Celebrate achievements and work on improvement areas</div>
            </>
          )}
          {currentView === "mobile" && (
            <>
              <div>• Quick access to your latest grades and exam results</div>
              <div>• Swipe to navigate between different time periods</div>
              <div>• Perfect for checking updates on the go</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGradebookContainer;
