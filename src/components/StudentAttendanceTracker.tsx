"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject: string;
  subjectId: string;
}

interface StudentAttendanceTrackerProps {
  studentId: string;
}

const StudentAttendanceTracker = ({ studentId }: StudentAttendanceTrackerProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Array<{id: string, name: string}>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
    fetchSubjects();
  }, [currentDate, studentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/student-attendance/monthly?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'x-user-id': studentId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.attendance || []);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/api/student-subjects?studentId=${studentId}`, {
        headers: {
          'x-user-id': studentId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAttendance = attendanceData.filter(record => 
      record.date === dateStr && 
      (selectedSubject === "all" || record.subjectId === selectedSubject)
    );
    return dayAttendance;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-blue-500';
      case 'late':
        return 'bg-yellow-500';
      case 'excused':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return '✅';
      case 'late':
        return '⏰';
      case 'excused':
        return '❎';
      case 'absent':
        return '❌';
      default:
        return '';
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          {/* Month Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold text-gray-900">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {monthDays.map((day) => {
            const dayAttendance = getAttendanceForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-2 border border-gray-100 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isTodayDate ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {/* Attendance Records */}
                <div className="space-y-1">
                  {dayAttendance.map((record, index) => (
                    <div
                      key={index}
                      className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${getStatusColor(record.status)} text-white`}
                      title={`${record.subject} - ${record.status}`}
                    >
                      <span>{getStatusIcon(record.status)}</span>
                      <span className="truncate">{record.subject.substring(0, 6)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Present ✅</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Late ⏰</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Excused ❎</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Absent ❌</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceTracker;
