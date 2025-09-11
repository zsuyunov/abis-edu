"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Edit3,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from "lucide-react";
import TeacherHomeworkContainer from "./TeacherHomeworkContainer";
import TeacherHomeworkCreationForm from "./TeacherHomeworkCreationForm";
import HomeworkAssignmentModal from "./HomeworkAssignmentModal";
import AttendanceForm from "./forms/AttendanceForm";
import GradeInputForm from "./GradeInputForm";

interface TeacherAssignment {
  id: string;
  role: "TEACHER" | "SUPERVISOR";
  Branch: {
    id: string;
    name: string;
    shortName: string;
  };
  Class: {
    id: string;
    name: string;
    branch: {
      id: string;
      name: string;
    };
  };
  Subject: {
    id: string;
    name: string;
  } | null;
  AcademicYear: {
    id: string;
    name: string;
  };
}

interface TimetableEntry {
  id: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  classroom: string;
  class: {
    id: string;
    name: string;
    academicYear?: {
      id: number;
      name: string;
    };
  };
  subject: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    shortName: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  topics: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  homework?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

interface TeacherScheduleDashboardProps {
  teacherId: string;
  teacherData: {
    id: string;
    firstName: string;
    lastName: string;
    TeacherAssignment: TeacherAssignment[];
  };
}

const TeacherScheduleDashboard = ({ teacherId, teacherData }: TeacherScheduleDashboardProps) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedRole, setSelectedRole] = useState<"TEACHER" | "SUPERVISOR">("TEACHER");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [homeworkModalOpen, setHomeworkModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [gradeInputFormOpen, setGradeInputFormOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableEntry | null>(null);
  const [homeworkContainerOpen, setHomeworkContainerOpen] = useState(false);
  const [homeworkCreationOpen, setHomeworkCreationOpen] = useState(false);
  const [homeworkRefreshKey, setHomeworkRefreshKey] = useState(0);
  const [newTopic, setNewTopic] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");

  // Get unique branches and roles from assignments
  const branches = Array.from(new Set(teacherData.TeacherAssignment.map(a => a.Branch.id)))
    .map(branchId => teacherData.TeacherAssignment.find(a => a.Branch.id === branchId)?.Branch)
    .filter(Boolean) as TeacherAssignment["Branch"][];

  const hasTeacherRole = teacherData.TeacherAssignment.some(a => a.role === "TEACHER");
  const hasSupervisorRole = teacherData.TeacherAssignment.some(a => a.role === "SUPERVISOR");

  // Set default branch
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // Fetch schedule data
  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate, selectedRole, selectedBranchId]);

  const fetchScheduleData = async () => {
    if (!selectedBranchId) return;
    
    try {
      setLoading(true);
      // Use local date string to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;
      const endDate = startDate;
      
      const response = await fetch(
        `/api/teacher-timetables?teacherId=${teacherId}&startDate=${startDate}&endDate=${endDate}&branchId=${selectedBranchId}&mode=${selectedRole.toLowerCase()}`,
        {
          headers: {
            'x-user-id': teacherId,
          },
        }
      );
      
      console.log('Selected Date:', selectedDate);
      console.log('Formatted Date for API:', startDate);
      console.log('API URL:', `/api/teacher-timetables?teacherId=${teacherId}&startDate=${startDate}&endDate=${endDate}&branchId=${selectedBranchId}&mode=${selectedRole.toLowerCase()}`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        return;
      }
      
      const data = await response.json();
      console.log('API Response Data:', data);
      
      // Filter timetables to only show those matching the selected date
      const filteredTimetables = (data.timetables || []).filter((timetable: any) => {
        const timetableDate = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        console.log('Comparing:', timetableDate, 'with selected:', startDate);
        return timetableDate === startDate;
      });

      // Remove duplicates based on unique combination of class, subject, and time
      const uniqueTimetables = filteredTimetables.filter((timetable: any, index: number, array: any[]) => {
        const uniqueKey = `${timetable.classId}-${timetable.subjectId}-${timetable.startTime}-${timetable.endTime}`;
        return array.findIndex((t: any) => 
          `${t.classId}-${t.subjectId}-${t.startTime}-${t.endTime}` === uniqueKey
        ) === index;
      });
      
      console.log('Filtered timetables count:', filteredTimetables.length);
      
      // Transform the unique data to match our interface
      const transformedTimetables = uniqueTimetables.map((timetable: any) => {
        console.log('Processing timetable:', timetable);
        
        // Use the original date from database
        const dateStr = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        
        return {
          id: timetable.id,
          fullDate: dateStr,
          startTime: timetable.startTime ? new Date(timetable.startTime).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : "00:00",
          endTime: timetable.endTime ? new Date(timetable.endTime).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : "00:00",
          lessonNumber: timetable.lessonNumber || 1,
          classroom: timetable.roomNumber || timetable.buildingName || "Classroom",
          class: {
            ...timetable.class,
            academicYear: timetable.class.academicYear || timetable.academicYear || { id: 1, name: "Default" }
          },
          subject: timetable.subject,
          branch: timetable.branch,
          topics: timetable.topics || [],
          homework: timetable.homework || []
        };
      });
      
      console.log('Transformed timetables:', transformedTimetables);
      setTimetables(transformedTimetables);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "prev" 
      ? subWeeks(currentWeek, 1) 
      : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeek(today);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds
  };

  const getLessonNumber = (index: number) => {
    return index + 1;
  };

  const handleHomework = (timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setHomeworkCreationOpen(true);
  };

  const getLessonStatus = (timetable: TimetableEntry) => {
    const now = new Date();
    const lessonDate = new Date(timetable.fullDate);
    const [startHour, startMinute] = timetable.startTime.split(':').map(Number);
    const [endHour, endMinute] = timetable.endTime.split(':').map(Number);
    
    const lessonStart = new Date(lessonDate);
    lessonStart.setHours(startHour, startMinute, 0, 0);
    
    const lessonEnd = new Date(lessonDate);
    lessonEnd.setHours(endHour, endMinute, 0, 0);
    
    if (now < lessonStart) {
      return 'upcoming';
    } else if (now > lessonEnd) {
      return 'completed';
    } else {
      return 'in-progress';
    }
  };

  const handleAttendance = (timetable: TimetableEntry) => {
    if (!timetable.class.academicYear?.id) {
      alert("Academic year information is missing for this timetable entry.");
      return;
    }
    
    setSelectedTimetable(timetable);
    setAttendanceModalOpen(true);
  };

  const handleGradebook = (timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setGradeInputFormOpen(true);
  };

  const handleSaveHomework = async (homeworkData: any) => {
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add form fields
      formData.append('teacherId', teacherId);
      formData.append('classId', homeworkData.classId);
      formData.append('subjectId', homeworkData.subjectId);
      formData.append('branchId', homeworkData.branchId);
      formData.append('title', homeworkData.title);
      formData.append('description', homeworkData.description || '');
      formData.append('instructions', homeworkData.instructions || '');
      formData.append('totalPoints', homeworkData.totalPoints || '0');
      formData.append('passingPoints', homeworkData.passingPoints || '0');
      formData.append('assignedDate', homeworkData.assignedDate);
      formData.append('dueDate', homeworkData.dueDate);
      formData.append('allowLateSubmission', homeworkData.allowLateSubmission?.toString() || 'true');
      formData.append('latePenaltyPerDay', homeworkData.latePenaltyPerDay || '0');

      const response = await fetch('/api/teacher-homework/with-files', {
        method: 'POST',
        headers: {
          'x-user-id': teacherId,
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Homework created successfully:', result);
        console.log('Homework ID:', result.homework?.id);
        console.log('Homework details:', result.homework);
        alert(`Homework "${homeworkData.title}" created successfully!`);
        // Refresh schedule data
        fetchScheduleData();
      } else {
        const error = await response.json();
        console.error('Failed to create homework:', error);
        alert(`Failed to create homework: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving homework:", error);
    }
  };

  const handleSaveAttendance = async (attendanceData: any) => {
    try {
      const response = await fetch('/api/teacher-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          teacherId: teacherId,
          timetableId: attendanceData.timetableId,
          branchId: attendanceData.branchId,
          classId: attendanceData.classId,
          subjectId: attendanceData.subjectId,
          academicYearId: 1, // TODO: Get from context or props
          date: attendanceData.date,
          attendances: attendanceData.records.map((record: any) => ({
            studentId: record.studentId,
            status: record.status,
            notes: record.notes,
          })),
        }),
      });
      
      if (response.ok) {
        // Refresh schedule data
        fetchScheduleData();
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  const handleSaveGrades = async (gradeData: any) => {
    try {
      const response = await fetch('/api/teacher-grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          branchId: gradeData.branchId,
          academicYearId: 1, // TODO: Get from context or props
          classId: gradeData.classId,
          subjectId: gradeData.subjectId,
          type: gradeData.assignmentType || 'DAILY_GRADE',
          date: gradeData.date,
          grades: gradeData.records.map((record: any) => ({
            studentId: record.studentId,
            value: record.score,
            maxValue: gradeData.maxScore,
            description: record.feedback || gradeData.assignmentTitle,
            timetableId: gradeData.timetableId,
          })),
        }),
      });
      
      if (response.ok) {
        // Refresh schedule data
        fetchScheduleData();
      }
    } catch (error) {
      console.error("Error saving grades:", error);
    }
  };

  const handleEditTopic = (timetable: TimetableEntry) => {
    setSelectedTimetable(timetable);
    setNewTopic(timetable.topics.length > 0 ? timetable.topics[0].title : "");
    setNewTopicDescription(timetable.topics.length > 0 ? timetable.topics[0].description : "");
    setShowTopicModal(true);
  };

  const handleSaveTopic = async () => {
    if (!selectedTimetable || !newTopic.trim()) return;
    
    try {
      const response = await fetch('/api/timetable-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          timetableId: selectedTimetable.id,
          title: newTopic.trim(),
          description: newTopicDescription.trim(),
          teacherId: teacherId,
        }),
      });

      if (response.ok) {
        // Refresh the schedule data
        await fetchScheduleData();
        setShowTopicModal(false);
        setNewTopic("");
        setNewTopicDescription("");
      } else {
        const errorData = await response.json();
        console.error("Error saving topic:", errorData);
        alert('Error saving topic. Please try again.');
      }
    } catch (error) {
      console.error("Error saving topic:", error);
      alert('Error saving topic. Please try again.');
    }
  };

  const getCurrentAssignments = () => {
    return teacherData.TeacherAssignment.filter(a => 
      a.role === selectedRole && a.Branch.id === selectedBranchId
    );
  };

  const currentAssignments = getCurrentAssignments();
  const isSupervisorMode = selectedRole === "SUPERVISOR";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with Teacher Info */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/50"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-lg">
              {teacherData.firstName[0]}{teacherData.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {teacherData.firstName} {teacherData.lastName}
              </h1>
              <p className="text-sm text-gray-600">
                {selectedRole === "TEACHER" ? "Subject Teacher" : "Supervisor"}
              </p>
            </div>
          </div>

          {/* Role and Branch Selectors */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Role Selector */}
            {(hasTeacherRole && hasSupervisorRole) && (
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setSelectedRole("TEACHER")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedRole === "TEACHER"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => setSelectedRole("SUPERVISOR")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedRole === "SUPERVISOR"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Supervisor
                </button>
              </div>
            )}

            {/* Branch Selector */}
            {branches.length > 1 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Class and Subject Info */}
        <div className="flex flex-wrap gap-2 mt-4">
          {currentAssignments.map((assignment, index) => (
            <div key={index} className="flex flex-wrap gap-1">
              <span className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 font-medium border border-blue-200">
                {assignment.Class.name}
              </span>
              {assignment.Subject && (
                <span className="px-2 py-1 rounded-lg text-xs bg-purple-50 text-purple-700 font-medium border border-purple-200">
                  {assignment.Subject.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Calendar Navigation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateWeek("prev")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMMM yyyy")}
            </h2>
            {!isSameDay(selectedDate, new Date()) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                Today
              </motion.button>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigateWeek("next")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </motion.button>
        </div>
        
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2">
          {eachDayOfInterval({
            start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
            end: endOfWeek(currentWeek, { weekStartsOn: 1 })
          }).map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <motion.button
                key={day.toISOString()}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectDate(day)}
                className={`p-3 rounded-xl text-center transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-lg"
                    : isTodayDate
                      ? "bg-orange-50 text-orange-700 border-2 border-orange-200"
                      : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {format(day, "EEE")}
                </div>
                <div className="text-lg font-bold">
                  {format(day, "d")}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Schedule Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-64"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </motion.div>
        ) : timetables.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-gray-200/50"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes today</h3>
            <p className="text-gray-600">Enjoy your free time!</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {timetables.map((timetable, index) => {
              const lessonStatus = getLessonStatus(timetable);
              
              // Dynamic styles based on lesson status
              let cardStyles = "";
              let statusIcon = null;
              let statusColor = "";
              
              switch (lessonStatus) {
                case 'upcoming':
                  cardStyles = "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-200/50";
                  statusIcon = <AlertCircle size={16} />;
                  statusColor = "bg-blue-100 text-blue-700 border-blue-200";
                  break;
                case 'in-progress':
                  cardStyles = "bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/50";
                  statusIcon = <PlayCircle size={16} />;
                  statusColor = "bg-green-100 text-green-700 border-green-200";
                  break;
                case 'completed':
                  cardStyles = "bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-gray-200/50";
                  statusIcon = <CheckCircle size={16} />;
                  statusColor = "bg-gray-100 text-gray-600 border-gray-200";
                  break;
              }
              
              return (
                <motion.div
                  key={timetable.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${cardStyles} rounded-2xl p-4 border backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                        #{getLessonNumber(index)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={12} />
                        {timetable.branch.shortName} • {timetable.classroom}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusColor}`}>
                      {statusIcon}
                      {lessonStatus === 'upcoming' ? 'Upcoming' : lessonStatus === 'in-progress' ? 'Live' : 'Done'}
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left side - Lesson info */}
                    <div className="flex-1 min-w-0">
                      {/* Class and Subject */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                        {timetable.class.name} • {timetable.subject.name}
                      </h3>
                      
                      {/* Time */}
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Clock size={14} />
                        {formatTime(timetable.startTime)} – {formatTime(timetable.endTime)}
                      </div>

                      {/* Topic */}
                      <div className="text-sm text-gray-600 mb-3">
                        {timetable.topics.length > 0 
                          ? timetable.topics[0].title 
                          : "No lesson topic set"
                        }
                      </div>

                      {/* Topics button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditTopic(timetable)}
                        disabled={isSupervisorMode}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Edit3 size={12} />
                        Topics
                      </motion.button>
                    </div>

                    {/* Right side - Action buttons */}
                    {!isSupervisorMode && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleHomework(timetable)}
                          className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
                          title="Assign Homework"
                        >
                          <BookOpen size={16} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAttendance(timetable)}
                          disabled={lessonStatus !== 'in-progress'}
                          className={`p-2 rounded-xl transition-colors flex items-center justify-center shadow-sm ${
                            lessonStatus === 'in-progress'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={
                            lessonStatus === 'upcoming' 
                              ? 'Available when lesson starts'
                              : lessonStatus === 'completed'
                              ? 'Lesson completed'
                              : 'Take Attendance'
                          }
                        >
                          <Users size={16} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleGradebook(timetable)}
                          className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center shadow-sm"
                          title="Input Grades"
                        >
                          <BarChart3 size={16} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topic Edit Modal */}
      <AnimatePresence>
        {showTopicModal && selectedTimetable && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Lesson Topic</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter lesson topic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTopicDescription}
                    onChange={(e) => setNewTopicDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter topic description"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTopicModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveTopic}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Homework Creation Form */}
      <AnimatePresence>
        {homeworkCreationOpen && selectedTimetable && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <TeacherHomeworkCreationForm
              teacherId={teacherId}
              timetable={selectedTimetable}
              onClose={() => setHomeworkCreationOpen(false)}
              onHomeworkCreated={() => {
                setHomeworkCreationOpen(false);
                fetchScheduleData();
                setHomeworkRefreshKey(prev => prev + 1);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Form */}
      {attendanceModalOpen && selectedTimetable && (
        <AttendanceForm
          type="attendance"
          data={{
            id: selectedTimetable.id,
            classId: selectedTimetable.class.id,
            subjectId: selectedTimetable.subject.id,
            academicYearId: selectedTimetable.class.academicYear?.id?.toString() || "",
            branchId: selectedTimetable.branch.id,
            className: selectedTimetable.class.name,
            subjectName: selectedTimetable.subject.name,
            date: selectedTimetable.fullDate,
            startTime: selectedTimetable.startTime,
            endTime: selectedTimetable.endTime,
            teacherId: teacherId
          }}
          setOpen={(open: boolean) => {
            setAttendanceModalOpen(open);
            if (!open) setSelectedTimetable(null);
          }}
          onSave={() => {
            fetchScheduleData();
          }}
        />
      )}

      {/* Grade Input Form */}
      {gradeInputFormOpen && selectedTimetable && (
        <GradeInputForm
          isOpen={gradeInputFormOpen}
          onClose={() => {
            setGradeInputFormOpen(false);
            setSelectedTimetable(null);
          }}
          timetableId={selectedTimetable.id.toString()}
          classId={selectedTimetable.class.id.toString()}
          subjectId={selectedTimetable.subject.id.toString()}
          teacherId={teacherId}
          date={selectedTimetable.fullDate}
          className={selectedTimetable.class.name}
          subjectName={selectedTimetable.subject.name}
          onSave={() => {
            fetchScheduleData();
          }}
        />
      )}
    </motion.div>
  );
};

export default TeacherScheduleDashboard;
