"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart3 } from 'lucide-react';
import TeacherHomeworkList from "./TeacherHomeworkList";
import TeacherHomeworkFilters from "./TeacherHomeworkFilters";
import TeacherHomeworkCreation from "./TeacherHomeworkCreation";
import TeacherHomeworkGrading from "./TeacherHomeworkGrading";

type ViewType = "list" | "export" | "edit" | "grading";

interface TeacherHomeworkContainerProps {
  teacherId: string;
}

const TeacherHomeworkContainer = ({ teacherId }: TeacherHomeworkContainerProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const [filters, setFilters] = useState({
    branchId: "",
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
    setSelectedHomeworkId(null);
  };

  const handleHomeworkEdit = (homeworkId: number) => {
    setSelectedHomeworkId(homeworkId);
    setCurrentView("edit");
  };

  const handleHomeworkGrading = (homeworkId: number) => {
    setSelectedHomeworkId(homeworkId);
    setCurrentView("grading");
  };


  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleHomeworkAction = async (homeworkId: number, action: 'archive' | 'restore' | 'delete') => {
    try {
      const response = await fetch(`/api/teacher-homework?id=${homeworkId}&action=${action}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
      });

      if (response.ok) {
        // Refresh homework data after successful action
        await fetchHomeworkData();
        
        // Show success message based on action
        const actionMessages = {
          archive: '✅ Homework archived successfully!',
          restore: '✅ Homework restored successfully!', 
          delete: '✅ Homework deleted successfully!'
        };
        
        showNotification(actionMessages[action], 'success');
      } else {
        const errorData = await response.json();
        showNotification(`❌ Failed to ${action} homework: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showNotification(`❌ Error ${action}ing homework: ${error instanceof Error ? error.message : 'Network error'}`, 'error');
    }
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
    setSelectedHomeworkId(null);
    // Refresh data
    fetchHomeworkData();
    showNotification('✅ Homework created successfully!', 'success');
  };

  const fetchHomeworkData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        ...filters,
      });

      console.log('Fetching homework with params:', Object.fromEntries(queryParams));
      const response = await fetch(`/api/teacher-homework?${queryParams}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Received homework data:', data);
        handleDataUpdate(data);
      } else {
        console.error('Failed to fetch homework:', response.status, response.statusText);
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
      case "export":
        return "📁";
      case "edit":
        return "✏️";
      case "grading":
        return "📝";
      default:
        return "📖";
    }
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case "list":
        return "My Homework";
      case "export":
        return "Export Reports";
      case "edit":
        return "Edit Homework";
      case "grading":
        return "Grade Submissions";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* TEACHER INFO HEADER */}
      {teacherData && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {teacherData.teacher.firstName} {teacherData.teacher.lastName}
                </h3>
                <div className="text-sm text-gray-600">
                  ID: {teacherData.teacher.teacherId} | Phone: {teacherData.teacher.phone || 'Not provided'}
                </div>
              </div>
            </div>
            
            {homeworkData.overallStats && (
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{homeworkData.overallStats.totalHomework}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{homeworkData.overallStats.averageSubmissionRate}%</div>
                  <div className="text-xs text-gray-600">Submitted</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{homeworkData.overallStats.averageGradingProgress}%</div>
                  <div className="text-xs text-gray-600">Graded</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* VIEW SELECTOR */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50"
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleViewChange("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              currentView === "list"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BookOpen size={16} />
            Homework List
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleViewChange("export")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              currentView === "export"
                ? "bg-cyan-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BarChart3 size={16} />
            Reports
          </motion.button>
        </div>
      </motion.div>

      {/* FILTERS */}
      <AnimatePresence>
        {currentView === "list" && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TeacherHomeworkFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              teacherData={teacherData}
              currentView={currentView}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACK BUTTON FOR EDIT/GRADING VIEWS */}
      <AnimatePresence>
        {(currentView === "edit" || currentView === "grading") && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleViewChange("list")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              ← Back to Homework List
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        {currentView === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TeacherHomeworkList
              teacherId={teacherId}
              homeworkData={homeworkData}
              loading={loading}
              onDataUpdate={handleDataUpdate}
              onHomeworkEdit={handleHomeworkEdit}
              onHomeworkAction={handleHomeworkAction}
              onHomeworkGrading={handleHomeworkGrading}
            />
          </motion.div>
        )}
        
        {currentView === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TeacherHomeworkCreation
              teacherId={teacherId}
              onHomeworkCreated={handleHomeworkCreated}
              teacherData={teacherData}
              isMobile={isMobile}
              editHomeworkId={selectedHomeworkId}
              onCancel={() => handleViewChange("list")}
            />
          </motion.div>
        )}
        
        {currentView === "grading" && (
          <motion.div
            key="grading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TeacherHomeworkGrading
              teacherId={teacherId}
              homeworkId={selectedHomeworkId}
              onBack={() => handleViewChange("list")}
            />
          </motion.div>
        )}
        
        {currentView === "export" && (
          <motion.div
            key="export"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-gray-200/50"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Homework Reports</h3>
            <p className="text-gray-600 mb-4">
              Generate comprehensive reports of your homework assignments and submissions.
            </p>
            <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-xl max-w-md mx-auto border border-blue-200">
              💡 <strong>Coming Soon:</strong> Advanced export functionality with PDF and Excel formats, custom date ranges, and detailed analytics.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-lg">
                {notification.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="font-medium">
                {notification.message}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeacherHomeworkContainer;
