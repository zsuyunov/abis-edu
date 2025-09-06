"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import TeacherHomeworkCreation from "./TeacherHomeworkCreation";
import TeacherHomeworkList from "./TeacherHomeworkList";
import TeacherHomeworkSubmissions from "./TeacherHomeworkSubmissions";
import TeacherHomeworkAnalytics from "./TeacherHomeworkAnalytics";
import TeacherHomeworkFilters from "./TeacherHomeworkFilters";

type ViewType = "list" | "create" | "submissions" | "analytics" | "export";

interface TeacherHomeworkContainerProps {
  teacherId: string;
}

const TeacherHomeworkContainer = ({ teacherId }: TeacherHomeworkContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    branchId: "",
    academicYearId: "",
    classId: "",
    subjectId: "",
    status: "ALL",
    startDate: "",
    endDate: "",
  });

  const [teacherData, setTeacherData] = useState<any>(null);
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
    if (view !== "submissions") {
      setSelectedHomeworkId(null);
    }
  };

  const handleHomeworkSelect = (homeworkId: number) => {
    setSelectedHomeworkId(homeworkId);
    setCurrentView("submissions");
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDataUpdate = (data: any) => {
    setTeacherData(data);
    setHomeworkData(data);
    setLoading(false);
  };

  const handleHomeworkCreated = () => {
    setCurrentView("list");
    // Refresh data
    fetchHomeworkData();
  };

  const fetchHomeworkData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        ...filters,
      });

      const response = await fetch(`/api/teacher-homework?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        handleDataUpdate(data);
      }
    } catch (error) {
      console.error("Error fetching homework data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchHomeworkData();
    }
  }, [teacherId, filters]);

  const getViewIcon = (view: ViewType) => {
    switch (view) {
      case "list":
        return "📚";
      case "create":
        return "📝";
      case "submissions":
        return "📋";
      case "analytics":
        return "📊";
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
      case "create":
        return "Create Homework";
      case "submissions":
        return "Track Submissions";
      case "analytics":
        return "Analytics";
      case "export":
        return "Export Reports";
      default:
        return "Homework";
    }
  };

  if (loading && !teacherData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📚</div>
        <div className="text-gray-600">Loading homework management system...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md p-4">
      {/* TEACHER INFO HEADER */}
      {teacherData && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Image src="/teacher.png" alt="Teacher" width={24} height={24} className="invert" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {teacherData.teacher.firstName} {teacherData.teacher.lastName}
                </h3>
                <div className="text-sm text-blue-700">
                  ID: {teacherData.teacher.teacherId} | Branch: {teacherData.teacher.branch.shortName}
                </div>
              </div>
            </div>
            
            {homeworkData.overallStats && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{homeworkData.overallStats.totalHomework}</div>
                  <div className="text-xs text-blue-700">Total Homework</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{homeworkData.overallStats.averageSubmissionRate}%</div>
                  <div className="text-xs text-green-700">Avg. Submission</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{homeworkData.overallStats.averageGradingProgress}%</div>
                  <div className="text-xs text-purple-700">Grading Progress</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW SELECTOR */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => handleViewChange("list")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "list"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("list")} {getViewTitle("list")}
        </button>
        <button
          onClick={() => handleViewChange("create")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "create"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("create")} {getViewTitle("create")}
        </button>
        <button
          onClick={() => handleViewChange("submissions")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "submissions"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("submissions")} {getViewTitle("submissions")}
        </button>
        <button
          onClick={() => handleViewChange("analytics")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "analytics"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("analytics")} {getViewTitle("analytics")}
        </button>
        <button
          onClick={() => handleViewChange("export")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "export"
              ? "bg-cyan-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("export")} {getViewTitle("export")}
        </button>
      </div>

      {/* FILTERS */}
      {(currentView === "list" || currentView === "submissions" || currentView === "analytics") && teacherData && (
        <TeacherHomeworkFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          currentView={currentView}
          teacherData={teacherData}
          isMobile={isMobile}
        />
      )}

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "create" && (
          <TeacherHomeworkCreation
            teacherId={teacherId}
            teacherData={teacherData}
            onHomeworkCreated={handleHomeworkCreated}
            onCancel={() => handleViewChange("list")}
          />
        )}
        
        {currentView === "list" && (
          <TeacherHomeworkList
            teacherId={teacherId}
            homeworkData={homeworkData}
            loading={loading}
            onHomeworkSelect={handleHomeworkSelect}
            onDataUpdate={handleDataUpdate}
          />
        )}
        
        {currentView === "submissions" && (
          <TeacherHomeworkSubmissions
            teacherId={teacherId}
            selectedHomeworkId={selectedHomeworkId}
            filters={filters}
            onDataUpdate={handleDataUpdate}
            isMobile={isMobile}
          />
        )}
        
        {currentView === "analytics" && (
          <TeacherHomeworkAnalytics
            teacherId={teacherId}
            filters={filters}
            onDataUpdate={handleDataUpdate}
            isMobile={isMobile}
          />
        )}
        
        {currentView === "export" && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Homework Reports</h3>
            <p className="text-gray-600 mb-4">
              Generate comprehensive reports of your homework assignments and submissions.
            </p>
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md max-w-md mx-auto">
              💡 <strong>Coming Soon:</strong> Advanced export functionality with PDF and Excel formats, custom date ranges, and detailed analytics.
            </div>
          </div>
        )}
      </div>

      {/* TEACHER GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-200">
        <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Teacher Homework Management Guide
        </h4>
        <div className="text-xs text-green-800 space-y-1">
          {currentView === "create" && (
            <>
              <div>• <strong>Multimedia Support:</strong> Add images, documents, audio, and video to enhance homework</div>
              <div>• <strong>Clear Instructions:</strong> Provide detailed instructions and grading criteria</div>
              <div>• <strong>Reasonable Deadlines:</strong> Allow sufficient time for students to complete work</div>
              <div>• <strong>Late Submissions:</strong> Configure late submission policies and penalties</div>
            </>
          )}
          {currentView === "list" && (
            <>
              <div>• <strong>Monitor Progress:</strong> Track submission rates and upcoming deadlines</div>
              <div>• <strong>Status Management:</strong> Keep homework organized with proper status updates</div>
              <div>• <strong>Quick Actions:</strong> Edit, view submissions, or archive completed work</div>
              <div>• <strong>Student Engagement:</strong> Aim for 85%+ submission rates for effective learning</div>
            </>
          )}
          {currentView === "submissions" && (
            <>
              <div>• <strong>Timely Feedback:</strong> Grade submissions within 2-3 days for maximum impact</div>
              <div>• <strong>Constructive Comments:</strong> Provide specific, actionable feedback</div>
              <div>• <strong>Fair Grading:</strong> Use consistent grading criteria across all students</div>
              <div>• <strong>Late Policy:</strong> Apply late penalties consistently and fairly</div>
            </>
          )}
          {currentView === "analytics" && (
            <>
              <div>• <strong>Track Trends:</strong> Monitor submission patterns and class performance</div>
              <div>• <strong>Identify Issues:</strong> Look for students or subjects with low engagement</div>
              <div>• <strong>Adjust Strategies:</strong> Use data to improve homework design and delivery</div>
              <div>• <strong>Celebrate Success:</strong> Recognize high-performing students and classes</div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t border-green-200">
            <div>🎯 <strong>Best Practice:</strong> Create engaging, meaningful homework that reinforces learning</div>
            <div>📱 <strong>Technology:</strong> Use multimedia attachments to create rich learning experiences</div>
            <div>⏰ <strong>Time Management:</strong> Balance homework load across subjects and deadlines</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHomeworkContainer;
