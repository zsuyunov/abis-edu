"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart3 } from 'lucide-react';
import TeacherHomeworkList from "./TeacherHomeworkList";
import TeacherHomeworkFilters from "./TeacherHomeworkFilters";
import TeacherHomeworkCreation from "./TeacherHomeworkCreation";
import TeacherHomeworkGrading from "./TeacherHomeworkGrading";
import { csrfFetch } from '@/hooks/useCsrfToken';

type ViewType = "list" | "export" | "edit" | "grading" | "create";

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
  
  // Lesson selection state for homework creation
  const [showLessonSelectionModal, setShowLessonSelectionModal] = useState(false);
  const [selectedLessonBranch, setSelectedLessonBranch] = useState<string>('');
  const [selectedLessonClass, setSelectedLessonClass] = useState<string>('');
  const [selectedLessonSubject, setSelectedLessonSubject] = useState<string>('');
  const [availableLessons, setAvailableLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

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

  // Lesson selection functions for homework creation
  const fetchAvailableLessons = async () => {
    if (!selectedLessonBranch || !selectedLessonClass || !selectedLessonSubject) return;

    setIsLoadingLessons(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/teacher-timetables?date=${today}&classId=${selectedLessonClass}&subjectId=${selectedLessonSubject}&branchId=${selectedLessonBranch}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const lessons = data.timetables || [];
        console.log('Fetched lessons for homework:', lessons);
        setAvailableLessons(lessons);

        // If there's only one lesson, auto-select it
        if (lessons.length === 1) {
          setSelectedLesson(lessons[0]);
          setCurrentView("create");
          setShowLessonSelectionModal(false);
        }
      }
    } catch (error) {
      console.error('Error fetching available lessons for homework:', error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleLessonSelect = (lesson: any) => {
    setSelectedLesson(lesson);
    setShowLessonSelectionModal(false);
    setCurrentView("create");
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
      const response = await csrfFetch(`/api/teacher-homework?id=${homeworkId}&action=${action}`, {
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
      case "create":
        return "➕";
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
      case "create":
        return "Create New Homework";
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
            onClick={() => setShowLessonSelectionModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              currentView === "create"
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BookOpen size={16} />
            Create Homework
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
        
            {currentView === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TeacherHomeworkCreation
                  teacherId={teacherId}
                  onHomeworkCreated={handleHomeworkCreated}
                  teacherData={teacherData}
                  isMobile={isMobile}
                  onCancel={() => {
                    handleViewChange("list");
                    setSelectedLesson(null);
                    setShowLessonSelectionModal(false);
                  }}
                  selectedLesson={selectedLesson}
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

      {/* Lesson Selection Modal */}
      <AnimatePresence>
        {showLessonSelectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Select Lesson for Homework</h3>
                <button
                  onClick={() => setShowLessonSelectionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Lesson Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="inline-block w-4 h-4 mr-1">🏢</span>
                      Branch
                    </label>
                    <select
                      value={selectedLessonBranch}
                      onChange={(e) => {
                        setSelectedLessonBranch(e.target.value);
                        setAvailableLessons([]);
                        setSelectedLesson(null);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Branch</option>
                      {teacherData?.assignedClasses?.map((cls: any) => cls.branch).filter((branch: any, index: number, self: any[]) => 
                        branch && self.findIndex(b => b.id === branch.id) === index
                      ).map((branch: any) => (
                        <option key={branch.id} value={branch.id}>{branch.shortName || branch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="inline-block w-4 h-4 mr-1">👥</span>
                      Class
                    </label>
                    <select
                      value={selectedLessonClass}
                      onChange={(e) => {
                        setSelectedLessonClass(e.target.value);
                        setAvailableLessons([]);
                        setSelectedLesson(null);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {teacherData?.assignedClasses?.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="inline-block w-4 h-4 mr-1">📚</span>
                      Subject
                    </label>
                    <select
                      value={selectedLessonSubject}
                      onChange={(e) => {
                        setSelectedLessonSubject(e.target.value);
                        setAvailableLessons([]);
                        setSelectedLesson(null);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {teacherData?.assignedSubjects?.map((subject: any) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Load Lessons Button */}
                {selectedLessonBranch && selectedLessonClass && selectedLessonSubject && (
                  <div className="text-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchAvailableLessons}
                      disabled={isLoadingLessons}
                      className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoadingLessons ? 'Loading Lessons...' : 'Load Today\'s Lessons'}
                    </motion.button>
                  </div>
                )}

                {/* Available Lessons */}
                {availableLessons.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Available Lessons for Today</h4>
                    <div className="space-y-2">
                      {availableLessons.map((lesson, index) => (
                        <div
                          key={index}
                          onClick={() => handleLessonSelect(lesson)}
                          className="p-4 border rounded-xl cursor-pointer transition-colors hover:border-green-300 hover:bg-green-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {lesson.class?.name || 'Unknown Class'} • {lesson.subjects?.[0]?.name || lesson.subject?.name || 'Unknown Subject'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {lesson.branch?.shortName || lesson.class?.branch?.shortName || 'Unknown Branch'}{lesson.roomNumber || lesson.buildingName ? ` • ${lesson.roomNumber || lesson.buildingName}` : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {lesson.startTime} - {lesson.endTime}
                              </div>
                              <div className="text-sm text-gray-600">
                                Lesson {lesson.lessonNumber || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowLessonSelectionModal(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
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
