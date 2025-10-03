"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import TeacherHomeworkContainer from "./TeacherHomeworkContainer";
import TeacherHomeworkCreationForm from "./TeacherHomeworkCreationForm";
import HomeworkAssignmentModal from "./HomeworkAssignmentModal";
import AttendanceForm from "./AttendanceForm";
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
  const [lessonData, setLessonData] = useState<{
    id: string;
    classId: string;
    subjectId: string;
    academicYearId: string;
    branchId: string;
    className: string;
    subjectName: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
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
      
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        return;
      }
      
      const data = await response.json();
      
      // Filter timetables to only show those matching the selected date
      const filteredTimetables = (data.timetables || []).filter((timetable: any) => {
        const timetableDate = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        return timetableDate === startDate;
      });
      
      
      // Transform the filtered data to match our interface
      const transformedTimetables = filteredTimetables.map((timetable: any) => {
        
        // Use the original date from database
        const dateStr = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        
        return {
          id: timetable.id,
          fullDate: dateStr,
          startTime: timetable.startTime || "00:00",
          endTime: timetable.endTime || "00:00",
          lessonNumber: timetable.lessonNumber || 1,
          classroom: timetable.roomNumber || timetable.buildingName || "Classroom",
          class: {
            ...timetable.class,
            academicYear: timetable.academicYear || { id: 1 }
          },
          subject: timetable.subject,
          branch: timetable.branch,
          topics: timetable.topics || [],
          homework: timetable.homework || []
        };
      });
      
      setTimetables(transformedTimetables);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
      setTimetables([]); // Ensure timetables is always an array
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
    return teacherData.TeacherAssignment.filter((a: TeacherAssignment) =>
      a.role === selectedRole && a.Branch.id === selectedBranchId
    );
  };

  const currentAssignments = getCurrentAssignments();
  const isSupervisorMode = selectedRole === "SUPERVISOR";

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
      {/* Header with Teacher Info and Selectors */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          {/* Title and Teacher Info Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{t('teacher.schedule.title')}</h1>
            
            {/* Teacher Info Card */}
            <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center">
                {teacherData.firstName[0]}{teacherData.lastName[0]}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {teacherData.firstName} {teacherData.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedRole === "TEACHER" ? "Subject Teacher" : "Supervisor"}
                </div>
              </div>
            </div>
          </div>

          {/* Selectors and Class Info Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Class and Subject Info */}
            <div className="flex flex-wrap gap-2">
              {currentAssignments.map((assignment, index) => (
                <div key={index} className="flex flex-wrap gap-1">
                  <span className="px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-700 font-medium">
                    {assignment.Class.name}
                  </span>
                  {assignment.Subject && (
                    <span className="px-3 py-1 rounded-md text-sm bg-purple-100 text-purple-700 font-medium">
                      {assignment.Subject.name}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Role and Branch Selectors */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Role Selector */}
              {(hasTeacherRole && hasSupervisorRole) && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedRole("TEACHER")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedRole === "TEACHER"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t('teacher.schedule.subjectTeacher')}
                  </button>
                  <button
                    onClick={() => setSelectedRole("SUPERVISOR")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedRole === "SUPERVISOR"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t('teacher.schedule.supervisor')}
                  </button>
                </div>
              )}

              {/* Branch Selector */}
              {branches.length > 1 && (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
        </div>

        {/* Weekly Calendar Navigation */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateWeek("prev")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMMM yyyy")}
              </h2>
              {!isSameDay(selectedDate, new Date()) && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            
            <button
              onClick={() => navigateWeek("next")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
                <button
                  key={day.toISOString()}
                  onClick={() => selectDate(day)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : isTodayDate
                        ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                        : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-lg font-bold">
                    {format(day, "d")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : !Array.isArray(timetables) || timetables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('teacher.schedule.noLessons')}</h3>
          <p className="text-gray-600">{t('teacher.schedule.enjoyFreeTime')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(timetables) ? timetables : []).map((timetable, index) => {
            const lessonStatus = getLessonStatus(timetable);
            
            // Dynamic styles based on lesson status
            let cardStyles = "";
            let statusBadge = "";
            let statusColor = "";
            
            switch (lessonStatus) {
              case 'upcoming':
                cardStyles = "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";
                statusBadge = t('teacher.schedule.status.upcoming');
                statusColor = "bg-blue-100 text-blue-800";
                break;
              case 'in-progress':
                cardStyles = "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200";
                statusBadge = t('teacher.schedule.status.inProgress');
                statusColor = "bg-green-100 text-green-800";
                break;
              case 'completed':
                cardStyles = "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
                statusBadge = t('teacher.schedule.status.completed');
                statusColor = "bg-gray-100 text-gray-600";
                break;
            }
            
            return (
            <div
              key={timetable.id}
              className={`${cardStyles} rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all duration-200`}
            >
              <div className="flex flex-col gap-4">
                {/* Header with lesson number and location */}
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {getLessonNumber(index)} {t('teacher.schedule.lesson')}, {timetable.branch.shortName} {t('teacher.schedule.room')}: {timetable.classroom}
                </div>
                
                {/* Main content */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left side - Lesson info */}
                  <div className="flex-1">
                    {/* Class and Subject */}
                    <div className="text-xl font-bold text-gray-900 mb-2">
                      {timetable.class.name}, {timetable.subject.name}
                    </div>
                    
                    {/* Time */}
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(timetable.startTime)} – {formatTime(timetable.endTime)}
                    </div>
                    

                    {/* Topic */}
                    <div className="text-sm text-gray-600 mb-4">
                      {timetable.topics.length > 0
                        ? timetable.topics[0].title
                        : t('teacher.schedule.noLessonTopic')
                      }
                    </div>

                    {/* Status and Topics buttons */}
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusColor}`}>
                        {statusBadge}
                      </div>
                      <button
                        onClick={() => handleEditTopic(timetable)}
                        disabled={isSupervisorMode}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t('teacher.schedule.editTopic')}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Topic Edit Modal */}
      {showTopicModal && selectedTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Lesson Topic</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter lesson topic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTopicDescription}
                  onChange={(e) => setNewTopicDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter topic description"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTopicModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTopic}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Homework Creation Form */}
      {homeworkCreationOpen && selectedTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <TeacherHomeworkCreationForm
            teacherId={teacherId}
            timetable={selectedTimetable}
            onClose={() => setHomeworkCreationOpen(false)}
            onHomeworkCreated={() => {
              setHomeworkCreationOpen(false);
              fetchScheduleData(); // Refresh data
              setHomeworkRefreshKey(prev => prev + 1); // Trigger homework container refresh
            }}
          />
        </div>
      )}

      {/* Attendance Form */}
      {attendanceModalOpen && lessonData && (
        <AttendanceForm
          isOpen={attendanceModalOpen}
          onClose={() => {
            setAttendanceModalOpen(false);
            setLessonData(null);
          }}
          lessonData={lessonData}
          teacherId={teacherId}
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
          timetableId={selectedTimetable.id}
          classId={selectedTimetable.class.id}
          subjectId={selectedTimetable.subject.id}
          teacherId={teacherId}
          date={selectedTimetable.fullDate}
          className={selectedTimetable.class.name}
          subjectName={selectedTimetable.subject.name}
        />
      )}
    </div>
  );
};

export default TeacherScheduleDashboard;
