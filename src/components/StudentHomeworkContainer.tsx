"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import StudentHomeworkList from "./StudentHomeworkList";
import StudentHomeworkSubmission from "./StudentHomeworkSubmission";
import StudentHomeworkTimeline from "./StudentHomeworkTimeline";
import StudentHomeworkAnalytics from "./StudentHomeworkAnalytics";
import StudentHomeworkMotivation from "./StudentHomeworkMotivation";
import StudentHomeworkFilters from "./StudentHomeworkFilters";

type ViewType = "list" | "submit" | "timeline" | "analytics" | "motivation" | "export";

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

      const response = await fetch(`/api/student-homework?${queryParams}`);
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
      case "timeline":
        return "📅";
      case "analytics":
        return "📊";
      case "motivation":
        return "🎯";
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
      case "timeline":
        return "Progress Timeline";
      case "analytics":
        return "My Analytics";
      case "motivation":
        return "Achievements";
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
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => handleViewChange("list")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "list"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("list")} {getViewTitle("list")}
        </button>
        <button
          onClick={() => handleViewChange("timeline")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "timeline"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("timeline")} {getViewTitle("timeline")}
        </button>
        <button
          onClick={() => handleViewChange("analytics")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "analytics"
              ? "bg-purple-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("analytics")} {getViewTitle("analytics")}
        </button>
        <button
          onClick={() => handleViewChange("motivation")}
          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            currentView === "motivation"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {getViewIcon("motivation")} {getViewTitle("motivation")}
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
      {(currentView === "list" || currentView === "timeline" || currentView === "analytics") && studentData && (
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
        
        {currentView === "timeline" && (
          <StudentHomeworkTimeline
            studentId={studentId}
            filters={filters}
            onDataUpdate={handleDataUpdate}
            isMobile={isMobile}
          />
        )}
        
        {currentView === "analytics" && (
          <StudentHomeworkAnalytics
            studentId={studentId}
            filters={filters}
            onDataUpdate={handleDataUpdate}
            isMobile={isMobile}
          />
        )}
        
        {currentView === "motivation" && (
          <StudentHomeworkMotivation
            studentId={studentId}
            motivationalData={studentData?.motivationalData}
            onDataUpdate={handleDataUpdate}
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
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => window.open(`/api/student-homework/export?format=pdf&studentId=${studentId}`)}
                className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => window.open(`/api/student-homework/export?format=excel&studentId=${studentId}`)}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                📊 Download Excel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STUDENT GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Student Homework Guide
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          {currentView === "list" && (
            <>
              <div>• <strong>Stay Organized:</strong> Check deadlines regularly and plan your work</div>
              <div>• <strong>Submit Early:</strong> Aim to submit assignments before the deadline</div>
              <div>• <strong>Read Instructions:</strong> Carefully read homework requirements and attachments</div>
              <div>• <strong>Ask Questions:</strong> Contact your teacher if you need clarification</div>
            </>
          )}
          {currentView === "submit" && (
            <>
              <div>• <strong>Multiple Formats:</strong> You can submit text, images, documents, and audio</div>
              <div>• <strong>Save Often:</strong> Your work is saved automatically as you type</div>
              <div>• <strong>Check Attachments:</strong> Review any files you've uploaded before submitting</div>
              <div>• <strong>Resubmission:</strong> You can update your submission until the deadline</div>
            </>
          )}
          {currentView === "analytics" && (
            <>
              <div>• <strong>Track Progress:</strong> Monitor your completion rates and grades</div>
              <div>• <strong>Identify Patterns:</strong> See which subjects need more attention</div>
              <div>• <strong>Set Goals:</strong> Aim for 90%+ completion and on-time submission rates</div>
              <div>• <strong>Celebrate Success:</strong> Acknowledge your achievements and improvements</div>
            </>
          )}
          {currentView === "motivation" && (
            <>
              <div>• <strong>Build Streaks:</strong> Complete homework on time to build your streak</div>
              <div>• <strong>Earn Badges:</strong> Achieve milestones to unlock special recognition</div>
              <div>• <strong>Stay Motivated:</strong> Use your progress to stay encouraged</div>
              <div>• <strong>Share Success:</strong> Show your achievements to parents and friends</div>
            </>
          )}
          
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div>🎯 <strong>Success Tip:</strong> Complete homework consistently to build good study habits</div>
            <div>📱 <strong>Mobile Access:</strong> You can view and submit homework from any device</div>
            <div>⏰ <strong>Time Management:</strong> Start assignments early to avoid last-minute stress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHomeworkContainer;
