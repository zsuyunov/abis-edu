"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

interface MonthlyTimetableProps {
  teacherId: string;
  filters: any;
  dateRange: { start: Date; end: Date };
}

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  timeSlot: string;
  startTime: string;
  endTime: string;
  className: string;
  subjectName: string;
  room: string;
  status: "active" | "inactive" | "cancelled";
  topicsCount: number;
  completedTopics: number;
  date: string;
}

const TeacherMonthlyTimetable = ({ teacherId, filters, dateRange }: MonthlyTimetableProps) => {
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayTimetables, setDayTimetables] = useState<TimetableSlot[]>([]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    fetchMonthlyTimetables();
  }, [teacherId, filters, currentMonth]);

  const fetchMonthlyTimetables = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await fetch(`/api/teacher-timetables?teacherId=${teacherId}&view=monthly&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`);
      const data = await response.json();
      setTimetables(data.timetables || []);
    } catch (error) {
      console.error("Error fetching monthly timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTimetablesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timetables.filter(t => t.date === dateStr);
  };

  const getDateStatus = (date: Date) => {
    const dateTimetables = getTimetablesForDate(date);
    if (dateTimetables.length === 0) return "no-classes";
    
    const hasActive = dateTimetables.some(t => t.status === "active");
    const hasCancelled = dateTimetables.some(t => t.status === "cancelled");
    
    if (hasCancelled && hasActive) return "mixed";
    if (hasCancelled) return "cancelled";
    return "active";
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setDayTimetables(getTimetablesForDate(date));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Calendar */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <p className="text-blue-600">Monthly timetable overview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-xl bg-gray-100 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-xl bg-gray-100 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {getDaysInMonth().map((date, index) => {
            if (!date) {
              return <div key={index} className="p-3 h-24"></div>;
            }
            
            const status = getDateStatus(date);
            const dateTimetables = getTimetablesForDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`p-2 h-24 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                    : isToday(date)
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300"
                    : status === "active"
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100"
                    : status === "cancelled"
                    ? "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                    : status === "mixed"
                    ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-semibold mb-1 ${
                    isSelected ? "text-white" : isToday(date) ? "text-orange-600" : "text-gray-700"
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {dateTimetables.length > 0 && (
                    <div className="flex-1 space-y-1">
                      <div className={`text-xs ${
                        isSelected ? "text-blue-100" : "text-gray-600"
                      }`}>
                        {dateTimetables.length} class{dateTimetables.length !== 1 ? "es" : ""}
                      </div>
                      
                      {dateTimetables.slice(0, 2).map((timetable, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-1 rounded truncate ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : timetable.status === "active"
                              ? "bg-green-100 text-green-700"
                              : timetable.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {timetable.subjectName}
                        </div>
                      ))}
                      
                      {dateTimetables.length > 2 && (
                        <div className={`text-xs ${
                          isSelected ? "text-blue-100" : "text-gray-500"
                        }`}>
                          +{dateTimetables.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">Classes scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-red-100 to-pink-100 border border-red-200 rounded"></div>
            <span className="text-gray-600">Cancelled classes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-yellow-100 to-orange-100 border border-yellow-300 rounded"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded"></div>
            <span className="text-gray-600">Selected date</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <p className="text-indigo-600">
                {dayTimetables.length} class{dayTimetables.length !== 1 ? "es" : ""} scheduled
              </p>
            </div>
          </div>

          {dayTimetables.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No classes scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayTimetables.map((timetable) => (
                <div
                  key={timetable.id}
                  className={`p-4 rounded-xl border-l-4 transition-all duration-300 hover:shadow-md ${
                    timetable.status === "active"
                      ? "bg-green-50 border-l-green-500"
                      : timetable.status === "cancelled"
                      ? "bg-red-50 border-l-red-500"
                      : "bg-gray-50 border-l-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-1.5 rounded-lg ${
                          timetable.status === "active"
                            ? "bg-green-100"
                            : timetable.status === "cancelled"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}>
                          <BookOpen className={`w-4 h-4 ${
                            timetable.status === "active"
                              ? "text-green-600"
                              : timetable.status === "cancelled"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{timetable.subjectName}</h4>
                          <p className="text-sm text-gray-600">{timetable.className}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {timetable.startTime} - {timetable.endTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {timetable.room}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Topics: {timetable.completedTopics}/{timetable.topicsCount}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {timetable.status === "active" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {timetable.status === "cancelled" && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      {timetable.status === "inactive" && (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherMonthlyTimetable;
