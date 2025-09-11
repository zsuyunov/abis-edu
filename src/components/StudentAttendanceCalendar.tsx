"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StudentAttendanceCalendarProps {
  studentId: string;
}

const StudentAttendanceCalendar = ({ studentId }: StudentAttendanceCalendarProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<any>({});
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceCalendar();
  }, [selectedMonth, selectedSubject, studentId]);

  const fetchAttendanceCalendar = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const params = new URLSearchParams({
        view: "calendar",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      if (selectedSubject) {
        params.append("subjectId", selectedSubject);
      }

      const response = await fetch(`/api/student-attendance?${params}`, {
        headers: {
          'x-user-id': studentId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.calendarData || {});
        
        // Fetch subjects if not already loaded
        if (subjects.length === 0) {
          const statsResponse = await fetch(`/api/student-attendance?view=stats`, {
            headers: {
              'x-user-id': studentId,
            },
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setSubjects(statsData.subjects || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching attendance calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "✅";
      case "ABSENT":
        return "❌";
      case "LATE":
        return "⏰";
      case "EXCUSED":
        return "✋";
      default:
        return "⚪";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 border-green-200";
      case "ABSENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "LATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EXCUSED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAttendanceForDate = (day: number) => {
    const dateKey = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
      .toISOString().split('T')[0];
    return attendanceData[dateKey] || [];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>📅</span>
            Attendance Calendar
          </h3>
          
          {/* Subject Filter */}
          <div className="flex items-center gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
          >
            <Image src="/arrow-left.png" alt="Previous" width={20} height={20} />
          </button>
          
          <h4 className="text-xl font-semibold text-gray-900">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
          >
            <Image src="/arrow-right.png" alt="Next" width={20} height={20} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-2xl mb-2">📅</div>
            <div className="text-gray-600">Loading calendar...</div>
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                if (day === null) {
                  return <div key={index} className="h-20"></div>;
                }

                const dayAttendance = getAttendanceForDate(day);
                const hasAttendance = dayAttendance.length > 0;
                const isToday = new Date().toDateString() === new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toDateString();

                return (
                  <div
                    key={day}
                    className={`h-20 border rounded-lg p-2 transition-colors ${
                      isToday 
                        ? "border-blue-500 bg-blue-50" 
                        : hasAttendance 
                        ? "border-gray-300 bg-gray-50" 
                        : "border-gray-200"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                    
                    {hasAttendance && (
                      <div className="space-y-1">
                        {dayAttendance.slice(0, 2).map((record: any, idx: number) => (
                          <div
                            key={idx}
                            className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(record.status)}`}
                            title={`${record.timetable.subject.name} - ${record.status}`}
                          >
                            <div className="flex items-center gap-1">
                              <span>{getStatusIcon(record.status)}</span>
                              <span className="truncate">{record.timetable.subject.name.substring(0, 3)}</span>
                            </div>
                          </div>
                        ))}
                        
                        {dayAttendance.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayAttendance.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏰</span>
            <span className="text-gray-600">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✋</span>
            <span className="text-gray-600">Excused</span>
          </div>
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span className="text-gray-600">Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceCalendar;
