"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentAttendanceContainer from "./StudentAttendanceContainer";
import StudentAttendanceAnalytics from "./StudentAttendanceAnalytics";
import StudentGradeStatistics from "./StudentGradeStatistics";
import { CheckCircle, Clock, XCircle, AlertCircle, Calendar, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentBranch {
  id: number;
  legalName: string;
  shortName: string;
}

interface StudentClass {
  id: number;
  name: string;
  branch: StudentBranch;
}

interface TimetableEntry {
  id: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  classroom: string;
  subject: {
    id: string;
    name: string;
  };
  topics: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  attendance?: {
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  };
}

interface StudentScheduleDashboardProps {
  studentId: string;
  studentData: {
    id: string;
    firstName: string;
    lastName: string;
    branch: StudentBranch | null;
    class: StudentClass | null;
  };
}

const StudentScheduleDashboard = ({ studentId, studentData }: StudentScheduleDashboardProps) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttendance, setShowAttendance] = useState(false);

  // Get student's branch and class info
  const branchId = studentData.branch?.id;
  const classId = studentData.class?.id;

  // Fetch schedule data
  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate]);

  const fetchScheduleData = async () => {
    if (!branchId || !classId) return;
    
    try {
      setLoading(true);
      // Use local date string to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const startDate = `${year}-${month}-${day}`;
      const endDate = startDate;
      
      const response = await fetch(
        `/api/student-timetables?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}&branchId=${branchId}&classId=${classId}`,
        {
          headers: {
            'x-user-id': studentId,
          },
        }
      );
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      
      // Filter timetables to only show those matching the selected date and remove duplicates
      const filteredTimetables = (data.timetables || []).filter((timetable: any) => {
        const timetableDate = typeof timetable.fullDate === 'string' 
          ? timetable.fullDate.split('T')[0] 
          : new Date(timetable.fullDate).toISOString().split('T')[0];
        return timetableDate === startDate;
      });
      
      // Remove duplicates based on unique combination of date, time, and subject
      const uniqueTimetables = filteredTimetables.filter((timetable: any, index: number, array: any[]) => {
        const currentKey = `${timetable.fullDate}-${timetable.startTime}-${timetable.subject?.id}`;
        return array.findIndex((t: any) => 
          `${t.fullDate}-${t.startTime}-${t.subject?.id}` === currentKey
        ) === index;
      });
      
      // Transform the filtered data to match our interface
      const transformedTimetables = uniqueTimetables.map((timetable: any) => {
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
          subject: timetable.subject,
          topics: timetable.topics || [],
          attendance: timetable.attendance
        };
      });
      
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

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getAttendanceText = (status: string) => {
    switch (status) {
      case 'present':
        return t('student.attendance.present');
      case 'late':
        return t('student.attendance.late');
      case 'excused':
        return t('student.attendance.excused');
      case 'absent':
        return t('student.attendance.absent');
      default:
        return '';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-blue-600 bg-blue-50';
      case 'late':
        return 'text-yellow-600 bg-yellow-50';
      case 'excused':
        return 'text-green-600 bg-green-50';
      case 'absent':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Header with Student Info */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('student.dashboard.title')}</h1>
              <p className="text-sm text-gray-600">Your daily schedule and activities</p>
            </div>
          </div>
          
          {/* Student Info Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 bg-gradient-to-r from-white to-gray-50 rounded-xl p-3 shadow-sm border border-gray-100"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-bold flex items-center justify-center">
              {studentData.firstName[0]}{studentData.lastName[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {studentData.firstName} {studentData.lastName}
              </div>
              <div className="text-xs text-gray-600">
                {studentData.class?.name} - {studentData.branch?.shortName}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Calendar Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek("prev")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMMM yyyy")}
              </h2>
              {!isSameDay(selectedDate, new Date()) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  Today
                </motion.button>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek("next")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectDate(day)}
                  className={`p-3 rounded-xl text-center transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                      : isTodayDate
                        ? "bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 border border-orange-300"
                        : "hover:bg-gray-100 text-gray-700 bg-white/50"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-sm font-bold">
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
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes today</h3>
              <p className="text-gray-600">Enjoy your free time!</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-3"
            >
              {timetables.map((timetable, index) => {
                const lessonDate = new Date(timetable.fullDate + 'T' + timetable.startTime);
                const lessonEndDate = new Date(timetable.fullDate + 'T' + timetable.endTime);
                const now = new Date();
                
                const isPastLesson = lessonEndDate < now;
                
                const cardStyles = isPastLesson 
                  ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200" 
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";
                
                return (
                  <motion.div
                    key={timetable.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`${cardStyles} rounded-2xl p-4 border shadow-sm hover:shadow-lg transition-all duration-200`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        {getLessonNumber(index)} LESSON • Room: {timetable.classroom}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="text-lg font-bold text-gray-900">
                          {timetable.subject.name}
                        </div>
                        
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTime(timetable.startTime)} – {formatTime(timetable.endTime)}
                        </div>

                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {timetable.topics.length > 0 
                            ? timetable.topics[0].title 
                            : "No lesson topic"
                          }
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            isPastLesson 
                              ? "bg-gray-100 text-gray-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {isPastLesson ? t('student.schedule.completed') : t('student.schedule.upcoming')}
                          </div>
                          
                          {isPastLesson && timetable.attendance && (
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${getAttendanceColor(timetable.attendance.status)}`}>
                              {getAttendanceIcon(timetable.attendance.status)}
                              <span className="hidden sm:inline">{getAttendanceText(timetable.attendance.status)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Sections */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-4"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 {t('student.dashboard.attendance')}
            </h3>
            <StudentAttendanceAnalytics studentId={studentId} />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📈 {t('student.dashboard.academicPerformance')}
            </h3>
            <StudentGradeStatistics studentId={studentId} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default StudentScheduleDashboard;
