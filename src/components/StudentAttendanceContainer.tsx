"use client";

import { useState, useEffect } from "react";
import StudentAttendanceOverview from "./StudentAttendanceOverview";
import StudentAttendanceCharts from "./StudentAttendanceCharts";
import StudentAttendanceMotivation from "./StudentAttendanceMotivation";
import StudentAttendanceFilters from "./StudentAttendanceFilters";

type ViewType = "overview" | "charts" | "records" | "export";
type TimeFilterType = "current" | "past";

interface StudentAttendanceContainerProps {
  studentId: string;
}

const StudentAttendanceContainer = ({ studentId }: StudentAttendanceContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("current");
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    academicYearId: "",
    subjectId: "",
    startDate: "",
    endDate: "",
  });

  const [studentData, setStudentData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>({});
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
  };

  const handleTimeFilterChange = (filter: TimeFilterType) => {
    setTimeFilter(filter);
    // Reset academic year filter when switching between current/past
    setFilters(prev => ({ ...prev, academicYearId: "" }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDataUpdate = (data: any) => {
    setStudentData(data.student);
    setAttendanceData(data);
    setLoading(false);
  };

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case "overview":
        return "📊";
      case "charts":
        return "📈";
      case "records":
        return "📋";
      case "export":
        return "📁";
      default:
        return "📝";
    }
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case "overview":
        return "Overview";
      case "charts":
        return "Charts & Insights";
      case "records":
        return "All Records";
      case "export":
        return "Export Reports";
      default:
        return "Attendance";
    }
  };

  return (
    <div className="bg-white rounded-md p-4">
      {/* MOTIVATIONAL SECTION (ALWAYS VISIBLE) */}
      {attendanceData.motivationalData && (
        <StudentAttendanceMotivation 
          motivationalData={attendanceData.motivationalData}
          summary={attendanceData.summary}
          student={studentData}
        />
      )}

      {/* CURRENT/PAST FILTER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => handleTimeFilterChange("current")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeFilter === "current"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Current Year
            </button>
            <button
              onClick={() => handleTimeFilterChange("past")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                timeFilter === "past"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Past Years
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {attendanceData.summary && (
          <div className="text-sm text-gray-600">
            {attendanceData.summary.totalRecords} records | {attendanceData.summary.attendanceRate}% attendance
          </div>
        )}
      </div>

      {/* VIEW SELECTOR */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => handleViewChange("overview")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "overview"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("overview")} {getViewTitle("overview")}
        </button>
        <button
          onClick={() => handleViewChange("charts")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "charts"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("charts")} {getViewTitle("charts")}
        </button>
        <button
          onClick={() => handleViewChange("records")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "records"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("records")} {getViewTitle("records")}
        </button>
        <button
          onClick={() => handleViewChange("export")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "export"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("export")} {getViewTitle("export")}
        </button>
      </div>

      {/* FILTERS */}
      <StudentAttendanceFilters
        filters={filters}
        timeFilter={timeFilter}
        onFilterChange={handleFilterChange}
        currentView={currentView}
        availableFilters={attendanceData}
        isMobile={isMobile}
        studentId={studentId}
        onDataUpdate={handleDataUpdate}
      />

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "overview" && (
          <StudentAttendanceOverview
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            attendanceData={attendanceData}
            onDataUpdate={handleDataUpdate}
          />
        )}
        
        {currentView === "charts" && (
          <StudentAttendanceCharts
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            attendanceData={attendanceData}
            onDataUpdate={handleDataUpdate}
          />
        )}
        
        {(currentView === "records" || currentView === "export") && (
          <StudentAttendanceOverview
            studentId={studentId}
            filters={filters}
            timeFilter={timeFilter}
            attendanceData={attendanceData}
            view={currentView}
            onDataUpdate={handleDataUpdate}
          />
        )}
      </div>

      {/* STUDENT GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Understanding Your Attendance
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          {currentView === "overview" && (
            <>
              <div>• <strong>Attendance Rate:</strong> Percentage of classes you attended (aim for 85% or higher)</div>
              <div>• <strong>Present:</strong> You were in class and participating</div>
              <div>• <strong>Absent:</strong> You missed the class</div>
              <div>• <strong>Late:</strong> You arrived after class started</div>
              <div>• <strong>Excused:</strong> Authorized absence (medical, family emergency, etc.)</div>
            </>
          )}
          {currentView === "charts" && (
            <>
              <div>• <strong>Trend Chart:</strong> Shows your attendance pattern over time</div>
              <div>• <strong>Subject Breakdown:</strong> Compare attendance across different subjects</div>
              <div>• <strong>Status Distribution:</strong> Visual breakdown of present/absent/late</div>
              <div>• <strong>Monthly View:</strong> Track attendance improvements month by month</div>
            </>
          )}
          {currentView === "records" && (
            <>
              <div>• <strong>Complete History:</strong> All your attendance records in chronological order</div>
              <div>• <strong>Filter Options:</strong> Use filters to find specific records</div>
              <div>• <strong>Teacher Notes:</strong> View any notes added by your teachers</div>
              <div>• <strong>Status Details:</strong> Understand the reason for each attendance status</div>
            </>
          )}
          {currentView === "export" && (
            <>
              <div>• <strong>Personal Reports:</strong> Generate your own attendance reports</div>
              <div>• <strong>Multiple Formats:</strong> Choose PDF for viewing or Excel for analysis</div>
              <div>• <strong>Custom Periods:</strong> Export data for specific date ranges</div>
              <div>• <strong>Subject Focus:</strong> Generate reports for specific subjects</div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div>🎯 <strong>Goal:</strong> Maintain at least 85% attendance for optimal academic success</div>
            <div>🏆 <strong>Excellence:</strong> Strive for 95%+ attendance to earn recognition badges</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceContainer;
