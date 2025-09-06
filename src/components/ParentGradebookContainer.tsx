"use client";

import { useState, useEffect } from "react";
import ParentChildSelector from "./ParentChildSelector";
import ParentGradebookOverview from "./ParentGradebookOverview";
import ParentExamResults from "./ParentExamResults";
import ParentPerformanceDashboard from "./ParentPerformanceDashboard";
import ParentGradebookFilters from "./ParentGradebookFilters";
import ParentMobileGradebook from "./ParentMobileGradebook";
import ParentInsightsAlerts from "./ParentInsightsAlerts";

type ViewType = "overview" | "exams" | "analytics" | "comparison" | "mobile";
type TimeFilterType = "current" | "past";

interface ParentGradebookContainerProps {
  parentId: string;
}

const ParentGradebookContainer = ({ parentId }: ParentGradebookContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("current");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    academicYearId: "",
    subjectId: "",
    gradeType: "",
    startDate: "",
    endDate: "",
    includeClassAverage: false,
  });

  const [parentData, setParentData] = useState<any>(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [availableAcademicYears, setAvailableAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [insights, setInsights] = useState<any>(null);

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

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    // Reset filters when changing child
    setFilters({
      academicYearId: "",
      subjectId: "",
      gradeType: "",
      startDate: "",
      endDate: "",
      includeClassAverage: false,
    });
  };

  const handleBranchChange = (branchId: number) => {
    setSelectedBranchId(branchId);
    // Reset child and filters when changing branch
    setSelectedChildId("");
    setFilters({
      academicYearId: "",
      subjectId: "",
      gradeType: "",
      startDate: "",
      endDate: "",
      includeClassAverage: false,
    });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleParentDataUpdate = (data: any) => {
    setParentData(data.parent);
    setChildren(data.children || []);
    setSelectedChild(data.selectedChild);
    setAvailableAcademicYears(data.availableAcademicYears || []);
    setSubjects(data.subjects || []);
    setInsights(data.insights);
    
    // Auto-select first child if none selected
    if (!selectedChildId && data.children && data.children.length > 0) {
      setSelectedChildId(data.children[0].id);
    }
  };

  return (
    <div className="bg-white rounded-md p-4">
      {/* CHILD SELECTOR (TOP OF PAGE) */}
      <ParentChildSelector
        parentId={parentId}
        children={children}
        selectedChildId={selectedChildId}
        selectedBranchId={selectedBranchId}
        onChildChange={handleChildChange}
        onBranchChange={handleBranchChange}
        onParentDataUpdate={handleParentDataUpdate}
      />

      {/* CURRENT/PAST FILTER */}
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
          
          {selectedChild && (
            <div className="text-sm text-gray-600">
              Viewing: {selectedChild.firstName} {selectedChild.lastName} ({selectedChild.studentId}) - {selectedChild.class.name}
            </div>
          )}
        </div>

        {timeFilter === "past" && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            📚 Historical Records
          </div>
        )}
      </div>

      {/* INSIGHTS & ALERTS */}
      {insights && insights.alerts && insights.alerts.length > 0 && (
        <ParentInsightsAlerts 
          insights={insights} 
          childName={selectedChild?.firstName || ""} 
        />
      )}

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
              📈 Performance Dashboard
            </button>
            {children.length > 1 && (
              <button
                onClick={() => handleViewChange("comparison")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === "comparison"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                👥 Compare Children
              </button>
            )}
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
      {currentView !== "mobile" && selectedChildId && (
        <ParentGradebookFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          currentView={currentView}
          timeFilter={timeFilter}
          availableAcademicYears={availableAcademicYears}
          subjects={subjects}
          isMobile={isMobile}
          parentId={parentId}
          selectedChildId={selectedChildId}
        />
      )}

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "mobile" && isMobile && selectedChildId && (
          <ParentMobileGradebook
            parentId={parentId}
            selectedChildId={selectedChildId}
            filters={filters}
            timeFilter={timeFilter}
            onParentDataUpdate={handleParentDataUpdate}
          />
        )}
        
        {currentView === "overview" && selectedChildId && (
          <ParentGradebookOverview
            parentId={parentId}
            selectedChildId={selectedChildId}
            filters={filters}
            timeFilter={timeFilter}
            onParentDataUpdate={handleParentDataUpdate}
          />
        )}
        
        {currentView === "exams" && selectedChildId && (
          <ParentExamResults
            parentId={parentId}
            selectedChildId={selectedChildId}
            filters={filters}
            timeFilter={timeFilter}
            onParentDataUpdate={handleParentDataUpdate}
          />
        )}
        
        {currentView === "analytics" && selectedChildId && (
          <ParentPerformanceDashboard
            parentId={parentId}
            selectedChildId={selectedChildId}
            filters={filters}
            timeFilter={timeFilter}
            onParentDataUpdate={handleParentDataUpdate}
          />
        )}
        
        {currentView === "comparison" && children.length > 1 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Children Comparison</h3>
            <p className="text-gray-600 mb-4">Compare academic performance across all your children</p>
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
              🚧 This feature is coming soon! You'll be able to compare your children's academic performance side-by-side.
            </div>
          </div>
        )}

        {!selectedChildId && children.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
            <p className="text-gray-600">
              No student records are associated with your parent account. Please contact the school administration if this is an error.
            </p>
          </div>
        )}

        {!selectedChildId && children.length > 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👆</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Child</h3>
            <p className="text-gray-600">
              Please select one of your children from the dropdown above to view their academic performance.
            </p>
          </div>
        )}
      </div>

      {/* PARENT GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Parent Guidance
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          {currentView === "overview" && (
            <>
              <div>• Monitor your child's grades across all subjects and assessment types</div>
              <div>• Use filters to focus on specific time periods or subjects of concern</div>
              <div>• Export academic reports for home discussions and record-keeping</div>
              <div>• Pay attention to grade trends and sudden changes in performance</div>
            </>
          )}
          {currentView === "exams" && (
            <>
              <div>• Review exam results and teacher feedback carefully</div>
              <div>• Focus on failed exams and develop improvement strategies</div>
              <div>• Discuss challenging subjects with your child and their teachers</div>
              <div>• Use exam feedback to guide home study sessions</div>
            </>
          )}
          {currentView === "analytics" && (
            <>
              <div>• Use performance trends to identify your child's academic patterns</div>
              <div>• Compare your child's performance with class averages when available</div>
              <div>• Celebrate achievements and address areas needing improvement</div>
              <div>• Share insights with teachers during parent-teacher conferences</div>
            </>
          )}
          {currentView === "mobile" && (
            <>
              <div>• Quickly check recent grades and exam results on-the-go</div>
              <div>• Perfect for daily monitoring of your child's academic progress</div>
              <div>• Swipe to navigate between different time periods</div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div>📞 <strong>Stay Connected:</strong> Maintain regular communication with teachers and attend parent-teacher meetings</div>
            <div>🏠 <strong>Home Support:</strong> Create a supportive learning environment and establish consistent study routines</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentGradebookContainer;
