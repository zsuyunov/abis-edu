/*
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  BookOpen, 
  User,
  Plus,
  Eye,
  TrendingUp
} from "lucide-react";

interface TimetableSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  subject: { name: string; id: number };
  teacher: { firstName: string; lastName: string; id: string };
  topics: TimetableSlotTopic[];
}

interface TimetableSlotTopic {
  id: number;
  topicTitle: string;
  topicDescription?: string;
  attachments: string[];
  status: string;
  progressPercentage: number;
  completedAt?: string;
  createdAt: string;
}

interface ParentTimetableCalendarProps {
  childId: string;
  academicYearId: number;
  isCurrent: boolean;
  childName: string;
}

const ParentTimetableCalendar = ({ childId, academicYearId, isCurrent, childName }: ParentTimetableCalendarProps) => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetableSlots();
  }, [childId, academicYearId]);

  const fetchTimetableSlots = async () => {
    try {
      const response = await fetch(`/api/parent/timetable-slots?childId=${childId}&academicYearId=${academicYearId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setSlots(data);
    } catch (error) {
      console.error("Failed to fetch timetable slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
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

  const getDaysInWeek = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSlotsForDate = (date: Date) => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      return slotDate.toDateString() === date.toDateString();
    });
  };

  const getSlotsForWeek = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return slots.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      return slotDate >= weekStart && slotDate <= weekEnd;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time);
      }
    }
    return slots;
  };

  const getSlotForTimeSlot = (date: Date, timeSlot: Date) => {
    return slots.find(slot => {
      const slotDate = new Date(slot.slotDate);
      const slotStart = new Date(slot.startTime);
      
      return slotDate.toDateString() === date.toDateString() &&
             slotStart.getHours() === timeSlot.getHours() &&
             slotStart.getMinutes() === timeSlot.getMinutes();
    });
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="space-y-4">
        {/* Week day headers }
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid }
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-32 border-2 border-gray-100 rounded-lg"></div>;
            }

            const daySlots = getSlotsForDate(day);
            const isCurrentDay = isToday(day);
            const isSelectedDay = isSelected(day);

            return (
              <div
                key={index}
                className={`h-32 border-2 rounded-lg p-2 cursor-pointer hover:shadow-md transition-all duration-200 ${
                  isCurrentDay ? "border-blue-400 bg-blue-50 shadow-lg" : "border-gray-200 hover:border-blue-300"
                } ${isSelectedDay ? "border-purple-400 bg-purple-50 shadow-lg" : ""}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    isCurrentDay ? "text-blue-700" : "text-gray-900"
                  }`}>
                    {day.getDate()}
                  </span>
                  {daySlots.length > 0 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {daySlots.length}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  {daySlots.slice(0, 2).map((slot) => (
                    <div
                      key={slot.id}
                      className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded px-2 py-1 truncate font-medium"
                    >
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {slot.subject.name}
                    </div>
                  ))}
                  {daySlots.length > 2 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{daySlots.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getDaysInWeek(currentDate);
    const weekSlots = getSlotsForWeek(weekDays[0]);

    return (
      <div className="space-y-4">
        {/* Week day headers }
        <div className="grid grid-cols-8 gap-2">
          <div className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">Time</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">
              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-xs ${isToday(day) ? "text-blue-600 font-bold" : ""}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots grid }
        <div className="grid grid-cols-8 gap-2">
          {getTimeSlots().map((timeSlot, index) => (
            <React.Fragment key={index}>
              <div className="text-xs text-gray-600 py-3 text-center bg-gray-50 rounded-lg font-medium">
                {timeSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {weekDays.map((day) => {
                const slot = getSlotForTimeSlot(day, timeSlot);
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[50px] border-2 rounded-lg p-2 ${
                      isCurrentDay ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    {slot && (
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 rounded-lg p-2 text-xs h-full">
                        <div className="font-semibold">{slot.subject.name}</div>
                        <div className="text-xs">{slot.teacher.firstName} {slot.teacher.lastName}</div>
                        <div className="text-xs">{slot.roomNumber}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const daySlots = getSlotsForDate(currentDate);
    const timeSlots = getTimeSlots();

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <p className="text-gray-600 mt-1">{childName}'s Schedule</p>
        </div>

        <div className="space-y-3">
          {timeSlots.map((timeSlot, index) => {
            const slot = getSlotForTimeSlot(currentDate, timeSlot);
            
            return (
              <div key={index} className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200">
                <div className="w-20 text-sm text-gray-600 font-medium bg-gray-100 p-2 rounded-lg text-center">
                  {timeSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1">
                  {slot ? (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg text-blue-900">{slot.subject.name}</h4>
                          <p className="text-sm text-blue-700">{slot.teacher.firstName} {slot.teacher.lastName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700 font-medium">{slot.roomNumber}</p>
                          {slot.buildingName && (
                            <p className="text-xs text-blue-600">{slot.buildingName}</p>
                          )}
                        </div>
                      </div>
                      {slot.topics.length > 0 && (
                        <div className="mt-3">
                          <Badge variant="outline" className="text-xs bg-blue-200 text-blue-800 border-blue-300">
                            {slot.topics.length} topic{slot.topics.length > 1 ? 's' : ''} available
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-gray-400 text-sm bg-gray-50 rounded-xl text-center">
                      No class scheduled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className="w-6 h-6" />
              Calendar View
            </CardTitle>
            <CardDescription className="text-blue-100">
              {childName}'s timetable in calendar format
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-white/20 overflow-hidden">
              <Button
                size="sm"
                variant={viewMode === "month" ? "default" : "ghost"}
                onClick={() => setViewMode("month")}
                className="rounded-none bg-white/10 hover:bg-white/20 text-white border-0"
              >
                Month
              </Button>
              <Button
                size="sm"
                variant={viewMode === "week" ? "default" : "ghost"}
                onClick={() => setViewMode("week")}
                className="rounded-none bg-white/10 hover:bg-white/20 text-white border-0"
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={viewMode === "day" ? "default" : "ghost"}
                onClick={() => setViewMode("day")}
                className="rounded-none bg-white/10 hover:bg-white/20 text-white border-0"
              >
                Day
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Navigation }
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewMode === "month") navigateMonth("prev");
                else if (viewMode === "week") navigateWeek("prev");
                else if (viewMode === "day") navigateDay("prev");
              }}
              className="shadow-sm border-2 border-gray-200 rounded-xl hover:border-blue-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-800">
              {viewMode === "month" 
                ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : viewMode === "week"
                ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })
              }
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewMode === "month") navigateMonth("next");
                else if (viewMode === "week") navigateWeek("next");
                else if (viewMode === "day") navigateDay("next");
              }}
              className="shadow-sm border-2 border-gray-200 rounded-xl hover:border-blue-500"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="shadow-sm border-2 border-gray-200 rounded-xl hover:border-blue-500"
          >
            Today
          </Button>
        </div>

        {/* Calendar Content }
        <div className="overflow-x-auto">
          {viewMode === "month" && renderMonthView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "day" && renderDayView()}
        </div>

        {/* Selected Date Details }
        {selectedDate && (
          <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h3>
            <div className="space-y-3">
              {getSlotsForDate(selectedDate).map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">
                      {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}
                    </span>
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">{slot.subject.name}</span>
                    <User className="w-5 h-5 text-purple-500" />
                    <span className="text-sm text-purple-700">{slot.teacher.firstName} {slot.teacher.lastName}</span>
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-orange-700">{slot.roomNumber}</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {slot.topics.length} topic{slot.topics.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
              {getSlotsForDate(selectedDate).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No classes scheduled for this day</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParentTimetableCalendar;

*/