"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Users, BookOpen, GraduationCap } from 'lucide-react';

interface TeacherClass {
  id: string;
  name: string;
}

interface TeacherSubject {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subject: {
    id: string;
    name: string;
  };
  class: {
    id: string;
    name: string;
  };
}

interface AttendanceHistoryProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchAttendanceData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass,
        subjectId: selectedSubject,
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear }),
        ...(selectedBranch && { branchId: selectedBranch })
      });

      const response = await fetch(`/api/attendance/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedBranch, currentDate]);

  const getAttendanceForDay = (day: Date) => {
    return attendanceData.filter(record => 
      isSameDay(new Date(record.date), day)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'EXCUSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Attendance History
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Class</option>
              {teacherClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {teacherSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {monthDays.map(day => {
            const dayAttendance = getAttendanceForDay(day);
            const hasData = dayAttendance.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-2 border rounded-md ${
                  hasData ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {format(day, 'd')}
                </div>
                
                {dayAttendance.length > 0 && (
                  <div className="space-y-1">
                    {dayAttendance.slice(0, 3).map(record => (
                      <div
                        key={record.id}
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}
                      >
                        {record.student.firstName} {record.student.lastName.charAt(0)}.
                      </div>
                    ))}
                    {dayAttendance.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAttendance.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!selectedClass || !selectedSubject ? (
        <div className="text-center py-8 text-gray-500">
          Please select both a class and subject to view attendance history.
        </div>
      ) : null}
    </div>
  );
};

export default AttendanceHistory;
