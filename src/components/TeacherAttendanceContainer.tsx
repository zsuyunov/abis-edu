"use client";

import { useState, useEffect } from "react";
import TeacherAttendanceTaking from "./TeacherAttendanceTaking";
import TeacherAttendanceHistory from "./TeacherAttendanceHistory";
import TeacherAttendanceAnalytics from "./TeacherAttendanceAnalytics";
import TeacherAttendanceFilters from "./TeacherAttendanceFilters";
import TeacherMobileAttendance from "./TeacherMobileAttendance";

type ViewType = "taking" | "history" | "analytics" | "mobile";

interface TeacherAttendanceContainerProps {
  teacherId: string;
}

const TeacherAttendanceContainer = ({ teacherId }: TeacherAttendanceContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("taking");
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    branchId: "",
    academicYearId: "",
    classId: "",
    subjectId: "",
    timetableId: "",
    date: new Date().toISOString().split('T')[0], // Today's date
    startDate: "",
    endDate: "",
    studentId: "",
    status: "",
  });

  const [teacherData, setTeacherData] = useState<any>(null);
  const [availableFilters, setAvailableFilters] = useState<any>({});
  const [timetables, setTimetables] = useState([]);

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
      setCurrentView("taking");
    }
  }, [isMobile]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTeacherDataUpdate = (data: any) => {
    setTeacherData(data.teacher);
    setAvailableFilters(data.availableFilters || {});
    setTimetables(data.timetables || []);
  };

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case "taking":
        return "✅";
      case "history":
        return "📋";
      case "analytics":
        return "📊";
      case "mobile":
        return "📱";
      default:
        return "📝";
    }
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case "taking":
        return "Take Attendance";
      case "history":
        return "Attendance History";
      case "analytics":
        return "Analytics & Reports";
      case "mobile":
        return "Mobile View";
      default:
        return "Attendance";
    }
  };

  return (
    <div className="bg-white rounded-md p-4">
      {/* VIEW SELECTOR (DESKTOP) */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleViewChange("taking")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "taking"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getViewIcon("taking")} Take Attendance
            </button>
            <button
              onClick={() => handleViewChange("history")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "history"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getViewIcon("history")} History
            </button>
            <button
              onClick={() => handleViewChange("analytics")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === "analytics"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getViewIcon("analytics")} Analytics
            </button>
          </div>

          {/* Quick Stats */}
          {teacherData && (
            <div className="text-sm text-gray-600">
              Branch: {teacherData.branch?.shortName} | Teacher: {teacherData.firstName} {teacherData.lastName}
            </div>
          )}
        </div>
      )}

      {/* MOBILE VIEW SELECTOR */}
      {isMobile && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => handleViewChange("mobile")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "mobile"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {getViewIcon("mobile")} Quick Attendance
          </button>
          <button
            onClick={() => handleViewChange("taking")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "taking"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {getViewIcon("taking")} Full View
          </button>
          <button
            onClick={() => handleViewChange("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "history"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {getViewIcon("history")} History
          </button>
          <button
            onClick={() => handleViewChange("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "analytics"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {getViewIcon("analytics")} Reports
          </button>
        </div>
      )}

      {/* FILTERS */}
      {currentView !== "mobile" && (
        <TeacherAttendanceFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          currentView={currentView}
          availableFilters={availableFilters}
          isMobile={isMobile}
          teacherId={teacherId}
          onTeacherDataUpdate={handleTeacherDataUpdate}
        />
      )}

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "mobile" && isMobile && (
          <TeacherMobileAttendance
            teacherId={teacherId}
            filters={filters}
            onFilterChange={handleFilterChange}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
        
        {currentView === "taking" && (
          <TeacherAttendanceTaking
            teacherId={teacherId}
            filters={filters}
            timetables={timetables}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
        
        {currentView === "history" && (
          <TeacherAttendanceHistory
            teacherId={teacherId}
            filters={filters}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
        
        {currentView === "analytics" && (
          <TeacherAttendanceAnalytics
            teacherId={teacherId}
            filters={filters}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
      </div>

      {/* TEACHER GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-200">
        <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Attendance Management Tips
        </h4>
        <div className="text-xs text-green-800 space-y-1">
          {currentView === "taking" && (
            <>
              <div>• <strong>Quick Taking:</strong> Use "Mark All Present" button first, then update absent/late students</div>
              <div>• <strong>Add Notes:</strong> Include reasons for absences or late arrivals when possible</div>
              <div>• <strong>Same-Day Edits:</strong> You can edit today's attendance, but historical records are locked</div>
              <div>• <strong>Double Check:</strong> Review attendance before submitting - accuracy is important</div>
            </>
          )}
          {currentView === "history" && (
            <>
              <div>• <strong>View Past Records:</strong> Review attendance patterns and make same-day corrections</div>
              <div>• <strong>Filter by Date:</strong> Use date ranges to find specific attendance records</div>
              <div>• <strong>Student Patterns:</strong> Look for attendance trends that may need attention</div>
              <div>• <strong>Export Reports:</strong> Generate reports for meetings with parents or administrators</div>
            </>
          )}
          {currentView === "analytics" && (
            <>
              <div>• <strong>Identify Patterns:</strong> Use analytics to spot students with attendance issues</div>
              <div>• <strong>Class Trends:</strong> Monitor overall class attendance rates and improvements</div>
              <div>• <strong>Early Intervention:</strong> Address frequent absences before they become problematic</div>
              <div>• <strong>Report Generation:</strong> Create detailed reports for administrative purposes</div>
            </>
          )}
          {currentView === "mobile" && (
            <>
              <div>• <strong>Quick Access:</strong> Perfect for taking attendance on-the-go</div>
              <div>• <strong>Touch Friendly:</strong> Large buttons designed for mobile devices</div>
              <div>• <strong>Offline Capable:</strong> Take attendance even with poor connectivity</div>
              <div>• <strong>Instant Updates:</strong> Changes sync immediately when connection is restored</div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t border-green-200">
            <div>📊 <strong>Best Practices:</strong> Take attendance promptly at the start of each class for accurate records</div>
            <div>🔒 <strong>Security:</strong> All attendance data is automatically filtered by your assigned branch</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceContainer;
