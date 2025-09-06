"use client";

import { useState, useEffect } from "react";
import TeacherGradeInput from "./TeacherGradeInput";
import TeacherExamResultInput from "./TeacherExamResultInput";
import TeacherGradebookOverview from "./TeacherGradebookOverview";
import TeacherGradebookAnalytics from "./TeacherGradebookAnalytics";
import TeacherGradebookFilters from "./TeacherGradebookFilters";

type ViewType = "overview" | "grade-input" | "exam-input" | "analytics";

interface TeacherGradebookContainerProps {
  teacherId: string;
}

const TeacherGradebookContainer = ({ teacherId }: TeacherGradebookContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [isMobile, setIsMobile] = useState(false);
  
  const [filters, setFilters] = useState({
    branchId: "",
    academicYearId: "",
    classId: "",
    subjectId: "",
    examId: "",
    gradeType: "",
    startDate: "",
    endDate: "",
    studentId: "",
  });

  const [teacherData, setTeacherData] = useState<any>(null);
  const [availableFilters, setAvailableFilters] = useState<any>({});

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

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTeacherDataUpdate = (data: any) => {
    setTeacherData(data.teacher);
    setAvailableFilters(data.filters || {});
  };

  const canInputGrades = () => {
    return filters.classId && filters.subjectId;
  };

  const canInputExamResults = () => {
    return filters.examId;
  };

  return (
    <div className="bg-white rounded-md p-4">
      {/* VIEW SELECTOR */}
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
            📊 Overview
          </button>
          <button
            onClick={() => handleViewChange("grade-input")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "grade-input"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ✏️ Input Grades
          </button>
          <button
            onClick={() => handleViewChange("exam-input")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "exam-input"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📝 Exam Results
          </button>
          <button
            onClick={() => handleViewChange("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === "analytics"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📈 Analytics
          </button>
        </div>

        {teacherData && (
          <div className="text-sm text-gray-600">
            Teacher: {teacherData.firstName} {teacherData.lastName}
          </div>
        )}
      </div>

      {/* FILTERS */}
      <TeacherGradebookFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        currentView={currentView}
        availableFilters={availableFilters}
        isMobile={isMobile}
        teacherId={teacherId}
        onTeacherDataUpdate={handleTeacherDataUpdate}
      />

      {/* FEATURE AVAILABILITY ALERTS */}
      {currentView === "grade-input" && !canInputGrades() && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-900">Grade Input Requirements</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Please select both a Class and Subject to enable grade input functionality.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentView === "exam-input" && !canInputExamResults() && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900">Exam Result Input Requirements</h4>
              <p className="text-sm text-blue-800 mt-1">
                Please select an Exam to enable exam result input functionality. Only admin-created exams assigned to you will appear in the list.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="mt-6">
        {currentView === "overview" && (
          <TeacherGradebookOverview
            teacherId={teacherId}
            filters={filters}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
        
        {currentView === "grade-input" && canInputGrades() && (
          <TeacherGradeInput
            teacherId={teacherId}
            filters={filters}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
        
        {currentView === "exam-input" && canInputExamResults() && (
          <TeacherExamResultInput
            teacherId={teacherId}
            filters={filters}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
        
        {currentView === "analytics" && (
          <TeacherGradebookAnalytics
            teacherId={teacherId}
            filters={filters}
            onTeacherDataUpdate={handleTeacherDataUpdate}
          />
        )}
      </div>

      {/* TEACHER GUIDANCE */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          Teacher Guidance
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          {currentView === "overview" && (
            <>
              <div>• Use the overview to see all grades and exam results for your assigned classes</div>
              <div>• Filter by specific classes, subjects, or time periods to focus on particular areas</div>
              <div>• Switch between daily, weekly, monthly, termly, and yearly grade views</div>
            </>
          )}
          {currentView === "grade-input" && (
            <>
              <div>• Select a class and subject first to enable grade input</div>
              <div>• Use bulk entry to quickly assign the same grade to multiple students</div>
              <div>• Grades are automatically saved as you type (draft mode)</div>
              <div>• Grade scale is 0-100 with automatic validation</div>
            </>
          )}
          {currentView === "exam-input" && (
            <>
              <div>• Only exams created by administrators and assigned to you will appear</div>
              <div>• Pass/Fail status is automatically calculated based on exam passing marks</div>
              <div>• Add feedback for individual students to help guide their improvement</div>
              <div>• Results are immediately visible to students and parents after submission</div>
            </>
          )}
          {currentView === "analytics" && (
            <>
              <div>• View class performance trends and identify students who need additional support</div>
              <div>• Compare performance across different subjects and time periods</div>
              <div>• Export reports for parent-teacher conferences and academic reviews</div>
              <div>• Use insights to adjust teaching strategies and focus areas</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherGradebookContainer;
