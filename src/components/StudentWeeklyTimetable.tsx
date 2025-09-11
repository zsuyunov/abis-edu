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
  Check,
  X,
  AlertCircle,
  Timer,
  UserCheck
} from "lucide-react";

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
  attendance?: {
    id: number;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    date: string;
  };
}

interface StudentWeeklyTimetableProps {
  studentId: string;
  studentData: any;
  relatedData: {
    timetables: TimetableEntry[];
    currentWeekStart: string;
  };
  onDataUpdate: (data: any) => void;
}

const StudentWeeklyTimetable: React.FC<StudentWeeklyTimetableProps> = ({
  studentId,
  studentData,
  relatedData,
  onDataUpdate,
}) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (relatedData?.timetables) {
      setTimetableData(relatedData.timetables);
    }
  }, [relatedData]);

  const getAttendanceIcon = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'ABSENT':
        return <X className="w-4 h-4 text-red-600" />;
      case 'LATE':
        return <Timer className="w-4 h-4 text-yellow-600" />;
      case 'EXCUSED':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAttendanceText = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'ABSENT':
        return 'Absent';
      case 'LATE':
        return 'Late';
      case 'EXCUSED':
        return 'Excused';
      default:
        return 'No Record';
    }
  };

  const getAttendanceColor = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'ABSENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'LATE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'EXCUSED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'RESCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentLesson = (entry: TimetableEntry) => {
    const now = new Date();
    const lessonDate = new Date(entry.fullDate);
    const [startHour, startMinute] = entry.startTime.split(':').map(Number);
    const [endHour, endMinute] = entry.endTime.split(':').map(Number);
    
    const lessonStart = new Date(lessonDate);
    lessonStart.setHours(startHour, startMinute, 0, 0);
    
    const lessonEnd = new Date(lessonDate);
    lessonEnd.setHours(endHour, endMinute, 0, 0);
    
    return now >= lessonStart && now <= lessonEnd;
  };

  const isPastLesson = (entry: TimetableEntry) => {
    const now = new Date();
    const lessonDate = new Date(entry.fullDate);
    const [endHour, endMinute] = entry.endTime.split(':').map(Number);
    
    const lessonEnd = new Date(lessonDate);
    lessonEnd.setHours(endHour, endMinute, 0, 0);
    
    return now > lessonEnd;
  };

  const groupByDay = (timetables: TimetableEntry[]) => {
    const grouped: { [key: string]: TimetableEntry[] } = {};
    
    timetables.forEach(entry => {
      const day = entry.day;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(entry);
    });
    
    // Sort entries within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return grouped;
  };

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const groupedTimetables = groupByDay(timetableData);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
              <p className="text-sm text-gray-600">
                {studentData?.student?.class?.name} • {studentData?.student?.branch?.shortName}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Current Week</div>
            <div className="font-medium text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-2xl mb-2">📚</div>
            <div className="text-gray-600">Loading schedule...</div>
          </div>
        ) : timetableData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
            <p className="text-gray-600">
              There are no classes scheduled for this week.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayOrder.map(day => {
              const dayTimetables = groupedTimetables[day] || [];
              
              if (dayTimetables.length === 0) return null;
              
              return (
                <div key={day} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-gray-900">{day}</h4>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-gray-500">
                      {dayTimetables.length} class{dayTimetables.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {dayTimetables.map((entry) => {
                      const isCurrent = isCurrentLesson(entry);
                      const isPast = isPastLesson(entry);
                      
                      return (
                        <div
                          key={entry.id}
                          className={`p-4 rounded-xl border transition-all duration-200 ${
                            isCurrent
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : isPast
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                  <h5 className="font-semibold text-gray-900">
                                    {entry.subject.name}
                                  </h5>
                                </div>
                                
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                  {entry.status}
                                </span>
                                
                                {isCurrent && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                    Live Now
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{entry.startTime} - {entry.endTime}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>
                                    Room {entry.roomNumber}
                                    {entry.buildingName && ` (${entry.buildingName})`}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>
                                    {entry.teacher.firstName} {entry.teacher.lastName}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Attendance Status for Past Lessons */}
                              {isPast && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Attendance:</span>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getAttendanceColor(entry.attendance?.status)}`}>
                                      {getAttendanceIcon(entry.attendance?.status)}
                                      <span>{getAttendanceText(entry.attendance?.status)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {isCurrent && (
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              )}
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Current Class</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-600" />
              <span className="text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-600" />
              <span className="text-gray-600">Absent</span>
            </div>
          </div>
          
          <div className="text-gray-500">
            Total: {timetableData.length} classes this week
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentWeeklyTimetable;
