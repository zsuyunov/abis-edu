"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users,
  Plus,
  Edit,
  Grid3X3,
  CalendarDays,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

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

interface TeacherTimetableCalendarProps {
  teacherId: string;
  teacherData: any;
  relatedData: {
    branches: any[];
    classes: any[];
    subjects: any[];
    supervisedClasses: any[];
  };
  filters: any;
  view: "monthly" | "yearly" | "calendar";
  dateRange: { start: Date; end: Date };
}

const TeacherTimetableCalendar = ({ teacherId, teacherData, relatedData, filters, view, dateRange }: TeacherTimetableCalendarProps) => {
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTimetableData();
  }, [teacherId, filters, view, dateRange]);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher-timetables?teacherId=${teacherId}&view=${view}&startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`);
      const data = await response.json();
      setTimetables(data.timetables || []);
    } catch (error) {
      console.error("Error fetching timetable data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetablesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timetables.filter(t => {
      const timetableDate = new Date(t.date).toISOString().split('T')[0];
      return timetableDate === dateStr;
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

  if (view === "monthly") {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Monthly Calendar</h2>
            <p className="text-blue-600">Overview of your teaching schedule</p>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-100 rounded-lg">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const currentMonth = new Date(dateRange.start);
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            const days = [];
            const currentDate = new Date(startDate);
            
            for (let i = 0; i < 42; i++) {
              days.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            }

            return days.map((day, index) => {
              const dayTimetables = getTimetablesForDate(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 rounded-lg ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-700' : ''}`}>
                    {day.getDate()}
                  </div>
                  
                <div className="space-y-1">
                  {dayTimetables.slice(0, 2).map((timetable) => (
                    <div
                      key={timetable.id}
                      className="text-xs bg-blue-50 border border-blue-200 p-2 rounded"
                    >
                      <div className="font-medium text-blue-800">{timetable.subjectName}</div>
                      <div className="text-blue-600">{timetable.className}</div>
                      <div className="text-blue-500">
                        {new Date(timetable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(timetable.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-blue-500">{timetable.room}</div>
                      <button
                        className="mt-1 px-1 py-0.5 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Handle topic click
                        }}
                      >
                        Topics
                      </button>
                    </div>
                  ))}
                  {dayTimetables.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayTimetables.length - 2} more
                    </div>
                  )}
                </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }

  if (view === "yearly") {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Yearly Overview</h2>
            <p className="text-purple-600">Annual teaching schedule</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(() => {
            const months = [];
            const currentYear = new Date(dateRange.start).getFullYear();
            
            for (let month = 0; month < 12; month++) {
              const monthDate = new Date(currentYear, month, 1);
              const monthTimetables = timetables.filter(t => {
                const timetableDate = new Date(t.date);
                return timetableDate.getFullYear() === currentYear && timetableDate.getMonth() === month;
              });
              
              months.push({ month: monthDate, timetables: monthTimetables });
            }
            
            return months.map(({ month, timetables: monthTimetables }) => (
              <div key={month.getMonth()} className="bg-white/50 rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  {month.toLocaleDateString('en-US', { month: 'long' })}
                </h3>
                <div className="space-y-2">
                  {monthTimetables.slice(0, 3).map((timetable) => (
                    <div key={timetable.id} className="text-sm bg-blue-50 border border-blue-200 p-2 rounded-lg">
                      <div className="font-medium text-blue-800">{timetable.subjectName}</div>
                      <div className="text-xs text-blue-600">{timetable.className}</div>
                      <div className="text-xs text-blue-500">
                        {new Date(timetable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(timetable.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-xs text-blue-500">{timetable.room}</div>
                      <button
                        className="mt-1 px-1 py-0.5 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Handle topic click
                        }}
                      >
                        Topics
                      </button>
                    </div>
                  ))}
                  {monthTimetables.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{monthTimetables.length - 3} more classes
                    </div>
                  )}
                  {monthTimetables.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No classes scheduled
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    );
  }

  // Calendar mode - show monthly view with navigation
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
          <Grid3X3 className="w-6 h-6 text-white" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Calendar View</h2>
            <p className="text-green-600">Interactive monthly calendar</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="px-4 py-2 font-medium text-gray-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-100 rounded-lg">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {(() => {
          const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const startDate = new Date(firstDay);
          startDate.setDate(startDate.getDate() - firstDay.getDay());
          
          const days = [];
          const currentDateCopy = new Date(startDate);
          
          for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDateCopy));
            currentDateCopy.setDate(currentDateCopy.getDate() + 1);
          }

          return days.map((day, index) => {
            const dayTimetables = getTimetablesForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-green-700' : ''}`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayTimetables.slice(0, 2).map((timetable) => (
                    <div
                      key={timetable.id}
                      className="text-xs bg-green-50 border border-green-200 p-2 rounded"
                    >
                      <div className="font-medium text-green-800">{timetable.subjectName}</div>
                      <div className="text-green-600">{timetable.className}</div>
                      <div className="text-green-500">
                        {new Date(timetable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(timetable.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="text-green-500">{timetable.room}</div>
                      <button
                        className="mt-1 px-1 py-0.5 bg-green-500 text-white rounded text-[10px] hover:bg-green-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Handle topic click
                        }}
                      >
                        Topics
                      </button>
                    </div>
                  ))}
                  {dayTimetables.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayTimetables.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
      
      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="space-y-2">
            {getTimetablesForDate(selectedDate).map((timetable) => (
              <div key={timetable.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{timetable.subjectName}</div>
                    <div className="text-sm text-gray-600">{timetable.className}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(timetable.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(timetable.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{timetable.room}</div>
                  </div>
                </div>
              </div>
            ))}
            {getTimetablesForDate(selectedDate).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No classes scheduled for this day
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

};

export default TeacherTimetableCalendar;