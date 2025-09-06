"use client";

import { useState, useEffect } from "react";
import ParentChildAttendanceSelector from "./ParentChildAttendanceSelector";
import ParentAttendanceOverview from "./ParentAttendanceOverview";
import ParentAttendanceCharts from "./ParentAttendanceCharts";
import ParentAttendanceAlerts from "./ParentAttendanceAlerts";
import ParentAttendanceFilters from "./ParentAttendanceFilters";

type ViewType = "overview" | "charts" | "comparison" | "records" | "export";
type TimeFilterType = "current" | "past";

interface ParentAttendanceContainerProps {
  parentId: string;
}

const ParentAttendanceContainer = ({ parentId }: ParentAttendanceContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("current");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    academicYearId: "",
    subjectId: "",
    startDate: "",
    endDate: "",
    includeClassAverage: false,
  });

  const [parentData, setParentData] = useState<any>(null);
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

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    // Update selected branch based on the new child's branch
    const newChild = parentData?.children.find((c: any) => c.id === childId);
    if (newChild) {
      setSelectedBranchId(newChild.branchId);
    }
    // Reset filters when changing child
    setFilters({
      academicYearId: "",
      subjectId: "",
      startDate: "",
      endDate: "",
      includeClassAverage: false,
    });
  };

  const handleBranchChange = (branchId: number) => {
    setSelectedBranchId(branchId);
    // Reset child and filters when changing branch
    setSelectedChildId(""); // Clear child selection
    setFilters({
      academicYearId: "",
      subjectId: "",
      startDate: "",
      endDate: "",
      includeClassAverage: false,
    });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDataUpdate = (data: any) => {
    setParentData(data);
    setAttendanceData(data);
    setLoading(false);
    
    // Set initial child and branch if not set
    if (!selectedChildId && data.children && data.children.length > 0) {
      setSelectedChildId(data.children[0].id);
      setSelectedBranchId(data.children[0].branchId);
    }
  };

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case "overview":
        return "📊";
      case "charts":
        return "📈";
      case "comparison":
        return "⚖️";
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
      case "comparison":
        return "Class Comparison";
      case "records":
        return "All Records";
      case "export":
        return "Export Reports";
      default:
        return "Attendance";
    }
  };

  const currentChild = parentData?.children?.find((child: any) => child.id === selectedChildId);
  const hasMultipleChildren = parentData?.children?.length > 1;

  return (
    <div className="bg-white rounded-md p-4">
      {/* CHILD SELECTOR */}
      <ParentChildAttendanceSelector
        parentId={parentId}
        childrenData={parentData?.children || []}
        selectedChildId={selectedChildId}
        selectedBranchId={selectedBranchId}
        onChildChange={handleChildChange}
        onBranchChange={handleBranchChange}
        onDataUpdate={handleDataUpdate}
        loading={loading}
      />

      {/* ALERTS AND NOTIFICATIONS */}
      {attendanceData.alerts && attendanceData.alerts.length > 0 && (
        <ParentAttendanceAlerts 
          alerts={attendanceData.alerts}
          child={currentChild}
          parentData={parentData}
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
        {attendanceData.summary && currentChild && (
          <div className="text-sm text-gray-600">
            {currentChild.firstName}: {attendanceData.summary.totalRecords} records | {attendanceData.summary.attendanceRate}% attendance
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
          onClick={() => handleViewChange("comparison")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "comparison"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("comparison")} {getViewTitle("comparison")}
        </button>
        {hasMultipleChildren && (
          <button
            onClick={() => handleViewChange("comparison")}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              currentView === "comparison"
                ? "bg-cyan-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            👥 Compare Children
          </button>
        )}
        <button
          onClick={() => handleViewChange("records")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "records"
              ? "bg-indigo-500 text-white"
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
      {currentChild && (
        <ParentAttendanceFilters
          filters={filters}
          timeFilter={timeFilter}
          onFilterChange={handleFilterChange}
          currentView={currentView}
          availableFilters={attendanceData}
          isMobile={isMobile}
          parentId={parentId}
          selectedChildId={selectedChildId}
          onDataUpdate={handleDataUpdate}
        />
      )}

      {/* CONTENT */}
      {currentChild && (
        <div className="mt-6">
          {currentView === "overview" && (
            <ParentAttendanceOverview
              parentId={parentId}
              selectedChild={currentChild}
              filters={filters}
              timeFilter={timeFilter}
              attendanceData={attendanceData}
              onDataUpdate={handleDataUpdate}
            />
          )}
          
          {currentView === "charts" && (
            <ParentAttendanceCharts
              parentId={parentId}
              selectedChild={currentChild}
              filters={filters}
              timeFilter={timeFilter}
              attendanceData={attendanceData}
              onDataUpdate={handleDataUpdate}
            />
          )}
          
          {currentView === "comparison" && (
            <ParentAttendanceCharts
              parentId={parentId}
              selectedChild={currentChild}
              filters={filters}
              timeFilter={timeFilter}
              attendanceData={attendanceData}
              view="comparison"
              onDataUpdate={handleDataUpdate}
            />
          )}
          
          {(currentView === "records" || currentView === "export") && (
            <ParentAttendanceOverview
              parentId={parentId}
              selectedChild={currentChild}
              filters={filters}
              timeFilter={timeFilter}
              attendanceData={attendanceData}
              view={currentView}
              onDataUpdate={handleDataUpdate}
            />
          )}
        </div>
      )}

      {/* NO CHILD SELECTED STATE */}
      {!currentChild && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Child</h3>
          <p className="text-gray-600 mb-4">
            Please select one of your children from the dropdown above to view their attendance information.
          </p>
        </div>
      )}

      {/* PARENT GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Parent Attendance Monitoring Guide
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          {currentView === "overview" && (
            <>
              <div>• <strong>Monitor Regularly:</strong> Check your child's attendance weekly to identify patterns</div>
              <div>• <strong>Understand Statuses:</strong> Present (✅), Absent (❌), Late (⏱), Excused (📝)</div>
              <div>• <strong>Communication:</strong> Contact teachers about frequent absences or tardiness</div>
              <div>• <strong>Target Goal:</strong> Aim for 95%+ attendance for optimal academic success</div>
            </>
          )}
          {currentView === "charts" && (
            <>
              <div>• <strong>Trend Analysis:</strong> Look for patterns in your child's attendance over time</div>
              <div>• <strong>Subject Comparison:</strong> Identify subjects with attendance issues</div>
              <div>• <strong>Class Comparison:</strong> See how your child compares to class average</div>
              <div>• <strong>Monthly Progress:</strong> Track improvements or concerns month by month</div>
            </>
          )}
          {currentView === "comparison" && (
            <>
              <div>• <strong>Class Benchmarking:</strong> Compare your child's attendance with class averages</div>
              <div>• <strong>Identify Patterns:</strong> Understand if issues are individual or class-wide</div>
              <div>• <strong>Set Goals:</strong> Use class averages as benchmarks for improvement</div>
              <div>• <strong>Multiple Children:</strong> Compare attendance between your children</div>
            </>
          )}
          {currentView === "records" && (
            <>
              <div>• <strong>Detailed History:</strong> Review complete attendance records chronologically</div>
              <div>• <strong>Teacher Notes:</strong> Read comments from teachers about absences</div>
              <div>• <strong>Pattern Detection:</strong> Look for recurring attendance issues</div>
              <div>• <strong>Documentation:</strong> Use detailed records for meetings with teachers</div>
            </>
          )}
          {currentView === "export" && (
            <>
              <div>• <strong>Report Generation:</strong> Create professional reports for school meetings</div>
              <div>• <strong>PDF Format:</strong> Best for sharing with teachers and administrators</div>
              <div>• <strong>Excel Format:</strong> Ideal for your own tracking and analysis</div>
              <div>• <strong>Class Comparison:</strong> Include class averages in reports for context</div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div>🎯 <strong>Best Practice:</strong> Review attendance weekly and address concerns promptly</div>
            <div>📞 <strong>Communication:</strong> Maintain open dialogue with teachers about attendance patterns</div>
            <div>🏥 <strong>Health Focus:</strong> Ensure regular sleep, nutrition, and health check-ups</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentAttendanceContainer;
