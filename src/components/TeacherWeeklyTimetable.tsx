"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  Calendar,
  User,
  GraduationCap,
  Building,
  ChevronRight,
  Plus,
  FileText,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Timer,
  UserCheck,
  GraduationCap as GradeIcon,
  BookMarked
} from "lucide-react";
import ClassworkTopicsModal from "./ClassworkTopicsModal";
import AttendanceForm from "./AttendanceForm";
import GradeModal from "./GradeModal";
import TeacherHomeworkCreationForm from "./TeacherHomeworkCreationForm";
// Remove any potential import conflicts
// import HomeworkAssignmentModal from "./HomeworkAssignmentModal";

interface TimetableEntry {
  id: number;
  fullDate: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  subject: { id: number; name: string };
  class: { id: number; name: string };
  teacher: { id: string; firstName: string; lastName: string };
  branch: { id: number; shortName: string };
  academicYear?: { id: number; name: string };
  topics?: Array<{
    id: number;
    title: string;
    description?: string;
    status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  }>;
}

interface TeacherWeeklyTimetableProps {
  teacherId: string;
  teacherData: any;
  relatedData: {
    branches: any[];
    classes: any[];
    subjects: any[];
    supervisedClasses: any[];
  };
  filters: any;
  dateRange: { start: Date; end: Date };
}

const TeacherWeeklyTimetable = ({ 
  teacherId, 
  teacherData, 
  relatedData, 
  filters, 
  dateRange 
}: TeacherWeeklyTimetableProps) => {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [supervisedTimetables, setSupervisedTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableEntry | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [selectedAttendanceSlot, setSelectedAttendanceSlot] = useState<any>(null);
  const [selectedGradeSlot, setSelectedGradeSlot] = useState<any>(null);
  const [selectedHomeworkSlot, setSelectedHomeworkSlot] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"own" | "supervised">("own");
  const [selectedSupervisedClass, setSelectedSupervisedClass] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  useEffect(() => {
    fetchTimetables();
  }, [teacherId, filters, dateRange, viewMode, selectedSupervisedClass]);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        teacherId,
        ...filters,
        startDate: dateRange.start.toISOString().split('T')[0],
        endDate: dateRange.end.toISOString().split('T')[0],
        view: "weekly",
        mode: viewMode,
        ...(selectedSupervisedClass && { supervisedClassId: selectedSupervisedClass })
      });

      const response = await fetch(`/api/teacher-timetables?${queryParams}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (viewMode === "own") {
        setTimetables(data.timetables || []);
        } else {
        setSupervisedTimetables(data.supervisedTimetables || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableForSlot = (day: string, timeSlot: string) => {
    const currentTimetables = viewMode === "own" ? timetables : supervisedTimetables;
    
    const result = currentTimetables.find(entry => {
      const entryDay = new Date(entry.fullDate).toLocaleDateString('en-US', { weekday: 'long' });
      const entryStartTime = new Date(entry.startTime);
      const entryEndTime = new Date(entry.endTime);
      
      // Convert time slot to date for comparison
      const today = new Date();
      const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), slotHours, slotMinutes);
      
      // Set entry times to same date for comparison
      const startDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
        entryStartTime.getHours(), entryStartTime.getMinutes());
      const endDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
        entryEndTime.getHours(), entryEndTime.getMinutes());
      
      // Check if day matches and if time slot falls within class time
      const dayMatches = entryDay === day;
      const timeOverlaps = slotDateTime >= startDateTime && slotDateTime < endDateTime;
      
      return dayMatches && timeOverlaps;
    });
    
    return result;
  };

  const handleTopicClick = (timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setShowTopicModal(true);
  };

  const handleAttendanceClick = (timetable: TimetableEntry) => {
    const lessonData = {
      id: timetable.id.toString(),
      classId: timetable.class.id.toString(),
      subjectId: timetable.subject.id.toString(),
      academicYearId: timetable.academicYear?.id.toString() || "1",
      branchId: timetable.branch.id.toString(),
      className: timetable.class.name,
      subjectName: timetable.subject.name,
      date: timetable.fullDate,
      startTime: timetable.startTime,
      endTime: timetable.endTime
    };
    console.log('Attendance lesson data:', lessonData);
    setSelectedAttendanceSlot(lessonData);
    setShowAttendanceModal(true);
  };

  const handleGradeClick = (timetable: TimetableEntry) => {
    const lessonData = {
      id: timetable.id.toString(),
      classId: timetable.class.id.toString(),
      subjectId: timetable.subject.id.toString(),
      academicYearId: timetable.academicYear?.id.toString() || "1",
      branchId: timetable.branch.id.toString(),
      className: timetable.class.name,
      subjectName: timetable.subject.name,
      date: timetable.fullDate,
      startTime: timetable.startTime,
      endTime: timetable.endTime
    };
    console.log('Grade lesson data:', lessonData);
    setSelectedGradeSlot(lessonData);
    setShowGradeModal(true);
  };

  const handleHomeworkClick = (timetable: TimetableEntry) => {
    const lessonData = {
      id: timetable.id.toString(),
      classId: timetable.class.id.toString(),
      subjectId: timetable.subject.id.toString(),
      academicYearId: timetable.academicYear?.id.toString() || "1",
      branchId: timetable.branch.id.toString(),
      className: timetable.class.name,
      subjectName: timetable.subject.name,
      date: timetable.fullDate,
      startTime: timetable.startTime,
      endTime: timetable.endTime
    };
    console.log('Homework lesson data:', lessonData);
    setSelectedHomeworkSlot(lessonData);
    setShowHomeworkModal(true);
  };

  const getTopicStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-3 h-3" />;
      case 'in_progress': return <Timer className="w-3 h-3" />;
      case 'cancelled': return <X className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const isToday = (day: string) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return day === today;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().substring(0, 5);
  };

  const isCurrentSlot = (day: string, timeSlot: string) => {
    return isToday(day) && getCurrentTime() >= timeSlot && getCurrentTime() < getNextTimeSlot(timeSlot);
  };

  const getNextTimeSlot = (currentSlot: string) => {
    const currentIndex = timeSlots.indexOf(currentSlot);
    return currentIndex < timeSlots.length - 1 ? timeSlots[currentIndex + 1] : "23:59";
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your weekly schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Selector & Supervised Class Selector */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Schedule</h3>
            <p className="text-sm text-gray-600">
              {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("own")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                viewMode === "own"
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
            >
                <User className="w-4 h-4 mr-2 inline" />
              My Classes
            </button>
              {relatedData.supervisedClasses.length > 0 && (
            <button
              onClick={() => setViewMode("supervised")}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                viewMode === "supervised"
                      ? "bg-indigo-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
              }`}
            >
                  <GraduationCap className="w-4 h-4 mr-2 inline" />
              Supervised Classes
            </button>
              )}
            </div>
            
            {/* Supervised Class Selector */}
            {viewMode === "supervised" && relatedData.supervisedClasses.length > 0 && (
              <select
                value={selectedSupervisedClass}
                onChange={(e) => setSelectedSupervisedClass(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white text-sm font-medium focus:border-indigo-500 transition-colors"
              >
                <option value="">All Supervised Classes</option>
                {relatedData.supervisedClasses.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.branch.shortName}
                  </option>
                ))}
              </select>
            )}
          </div>
          </div>
        </div>

      {/* Weekly Grid */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
      <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-0 min-w-[900px]">
            {/* Header Row */}
            <div className="bg-gradient-to-r from-slate-100 to-gray-100 p-4 font-medium text-gray-700 border-b border-gray-200">
              Time
            </div>
            {days.map((day) => (
              <div key={day} className={`p-4 font-medium text-center border-b border-gray-200 ${
                  isToday(day)
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200" 
                  : "bg-gradient-to-r from-slate-100 to-gray-100 text-gray-700"
              }`}>
                {day}
                {isToday(day) && (
                  <span className="block text-xs font-normal text-blue-600">Today</span>
                )}
              </div>
            ))}

            {/* Time Slots */}
          {timeSlots.map((timeSlot) => (
              <React.Fragment key={timeSlot}>
                <div className="p-3 text-sm font-medium text-gray-600 bg-gray-50/80 border-b border-gray-200 flex items-center justify-center">
                {timeSlot}
              </div>
              {days.map((day) => {
                const timetable = getTimetableForSlot(day, timeSlot);
                  const isCurrentTime = isCurrentSlot(day, timeSlot);
                
                return (
                    <div key={`${day}-${timeSlot}`} className={`min-h-[100px] border-b border-r border-gray-200 p-2 transition-all duration-200 ${
                      isCurrentTime 
                        ? "bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300" 
                        : "bg-white hover:bg-gray-50"
                    }`}>
                      {timetable && (
                        <div className={`h-full rounded-lg p-3 transition-all duration-200 hover:shadow-md cursor-pointer ${
                          timetable.status === "ACTIVE" 
                            ? "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200" 
                            : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
                        }`}>
                          {/* Subject and Class */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-sm text-blue-800">
                            {timetable.subject.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm text-indigo-700">
                                {timetable.class.name}
                              </span>
                          </div>

                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-orange-700">
                                {timetable.roomNumber}
                                {timetable.buildingName && ` (${timetable.buildingName})`}
                              </span>
                          </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="text-xs text-gray-600">
                                {new Date(timetable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                {new Date(timetable.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                          </div>
                        </div>

                          {/* Topics Summary */}
                          {timetable.topics && timetable.topics.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">
                                  {timetable.topics.length} topic{timetable.topics.length !== 1 ? 's' : ''}
                              </span>
                                <div className="flex gap-1">
                                  {timetable.topics.slice(0, 3).map((topic) => (
                                    <div 
                                      key={topic.id}
                                      className={`w-2 h-2 rounded-full border ${getTopicStatusColor(topic.status)}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-3 flex justify-between items-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              timetable.status === "ACTIVE" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {timetable.status}
                            </span>
                            
                            {/* Action buttons for own classes or if supervisor can edit */}
                            {(viewMode === "own" || (viewMode === "supervised" && timetable.teacher.id === teacherId)) && (
                              <div className="flex gap-1 flex-wrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAttendanceClick(timetable);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Attendance
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGradeClick(timetable);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white rounded-md text-xs font-medium hover:bg-purple-600 transition-colors"
                                >
                                  <GradeIcon className="w-3 h-3" />
                                  Grades
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHomeworkClick(timetable);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-md text-xs font-medium hover:bg-orange-600 transition-colors"
                                >
                                  <BookMarked className="w-3 h-3" />
                                  Homework
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTopicClick(timetable);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  Topics
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </React.Fragment>
          ))}
        </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {days.map((day) => {
          const dayTimetables = (viewMode === "own" ? timetables : supervisedTimetables).filter(t => 
            new Date(t.fullDate).toLocaleDateString('en-US', { weekday: 'long' }) === day
          );
          
          return (
            <div key={day} className={`bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 ${
              isToday(day) ? "ring-2 ring-blue-200 bg-blue-50/70" : ""
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${isToday(day) ? "text-blue-700" : "text-gray-700"}`}>
                  {day}
                </h4>
                <span className={`text-xs px-2 py-1 rounded-md ${
                  dayTimetables.length > 0 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {dayTimetables.length} classes
                </span>
      </div>

              <div className="space-y-2">
                {dayTimetables.slice(0, 3).map((timetable) => (
                  <div key={timetable.id} className="bg-white/50 rounded-lg p-2 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600">
                        {new Date(timetable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-700 truncate">
                        {timetable.subject.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {timetable.class.name} • {timetable.roomNumber}
          </div>
          </div>
                ))}
                
                {dayTimetables.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{dayTimetables.length - 3} more
          </div>
                )}
                
                {dayTimetables.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No classes scheduled
          </div>
                )}
          </div>
        </div>
          );
        })}
      </div>

      {/* Topics Modal */}
      {showTopicModal && selectedTimetable && (
        <ClassworkTopicsModal
          timetableSlot={{
            id: selectedTimetable.id.toString(),
            className: selectedTimetable.class.name,
            subjectName: selectedTimetable.subject.name,
            startTime: selectedTimetable.startTime,
            endTime: selectedTimetable.endTime,
            date: selectedTimetable.fullDate,
            room: selectedTimetable.roomNumber
          }}
          existingTopics={(selectedTimetable.topics || []).map(topic => ({
            id: topic.id.toString(),
            topicTitle: topic.title,
            topicDescription: topic.description || "",
            attachments: [],
            status: topic.status.toUpperCase() as "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
            progressPercentage: 0
          }))}
          onClose={() => {
            setShowTopicModal(false);
            setSelectedTimetable(null);
          }}
          onSave={(topics) => {
            // Handle saving topics
            console.log('Topics saved:', topics);
            fetchTimetables();
          }}
        />
      )}

      {/* Attendance Form */}
      {showAttendanceModal && selectedAttendanceSlot && (
        <AttendanceForm
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedAttendanceSlot(null);
          }}
          lessonData={selectedAttendanceSlot}
          teacherId={teacherId}
        />
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedGradeSlot && (
        <GradeModal
          isOpen={showGradeModal}
          onClose={() => {
            setShowGradeModal(false);
            setSelectedGradeSlot(null);
          }}
          lessonData={selectedGradeSlot}
          teacherId={teacherId}
        />
      )}

      {/* Homework Creation Form */}
      {showHomeworkModal && selectedHomeworkSlot && (
        <TeacherHomeworkCreationForm
          teacherId={teacherId}
          timetable={{
            id: selectedHomeworkSlot.id,
            class: { 
              id: selectedHomeworkSlot.classId, 
              name: selectedHomeworkSlot.className,
              academicYear: { id: parseInt(selectedHomeworkSlot.academicYearId) }
            },
            subject: { 
              id: selectedHomeworkSlot.subjectId, 
              name: selectedHomeworkSlot.subjectName 
            },
            branch: { 
              id: selectedHomeworkSlot.branchId, 
              shortName: "Branch" // You might want to get this from the data
            },
            fullDate: selectedHomeworkSlot.date,
            startTime: selectedHomeworkSlot.startTime,
            endTime: selectedHomeworkSlot.endTime
          }}
          onClose={() => {
            setShowHomeworkModal(false);
            setSelectedHomeworkSlot(null);
          }}
          onHomeworkCreated={() => {
            setShowHomeworkModal(false);
            setSelectedHomeworkSlot(null);
            // Refresh timetables if needed
            fetchTimetables();
          }}
        />
      )}
    </div>
  );
};

export default TeacherWeeklyTimetable;
