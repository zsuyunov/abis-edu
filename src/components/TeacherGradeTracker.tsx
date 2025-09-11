"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Users, BookOpen, GraduationCap } from 'lucide-react';

interface TeacherClass {
  id: number;
  name: string;
}

interface TeacherSubject {
  id: number;
  name: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface GradeRecord {
  id: string;
  date: string;
  grade: number;
  notes?: string;
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

interface TeacherGradeTrackerProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
}

const TeacherGradeTracker: React.FC<TeacherGradeTrackerProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [gradeData, setGradeData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchGradeData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass.toString(),
        subjectId: selectedSubject.toString(),
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear.toString() }),
        ...(selectedBranch && { branchId: selectedBranch.toString() })
      });

      const response = await fetch(`/api/grades/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGradeData(data);
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradeData();
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedBranch, currentDate]);

  const getGradesForDay = (day: Date) => {
    return gradeData.filter(record => 
      isSameDay(new Date(record.date), day)
    );
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-100 text-green-800';
    if (grade >= 80) return 'bg-blue-100 text-blue-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    if (grade >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const getAverageGrade = (grades: GradeRecord[]) => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade.grade, 0);
    return Math.round(sum / grades.length);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Grade Tracker
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
              onChange={(e) => setSelectedClass(e.target.value === '' ? '' : Number(e.target.value))}
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
              onChange={(e) => setSelectedSubject(e.target.value === '' ? '' : Number(e.target.value))}
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
              onChange={(e) => setSelectedAcademicYear(e.target.value === '' ? '' : Number(e.target.value))}
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
              onChange={(e) => setSelectedBranch(e.target.value === '' ? '' : Number(e.target.value))}
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

        {/* Statistics */}
        {selectedClass && selectedSubject && gradeData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">Total Grades</h4>
              <p className="text-2xl font-bold text-blue-900">{gradeData.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">Average Grade</h4>
              <p className="text-2xl font-bold text-green-900">{getAverageGrade(gradeData)}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-700">Highest Grade</h4>
              <p className="text-2xl font-bold text-yellow-900">
                {gradeData.length > 0 ? Math.max(...gradeData.map(g => g.grade)) : 0}%
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">Lowest Grade</h4>
              <p className="text-2xl font-bold text-red-900">
                {gradeData.length > 0 ? Math.min(...gradeData.map(g => g.grade)) : 0}%
              </p>
            </div>
          </div>
        )}
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
            const dayGrades = getGradesForDay(day);
            const hasData = dayGrades.length > 0;
            const avgGrade = hasData ? getAverageGrade(dayGrades) : 0;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border rounded-md ${
                  hasData ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {format(day, 'd')}
                </div>
                
                {hasData && (
                  <div className="space-y-1">
                    <div className={`text-xs px-2 py-1 rounded-full text-center font-medium ${getGradeColor(avgGrade)}`}>
                      Avg: {avgGrade}%
                    </div>
                    {dayGrades.slice(0, 2).map(record => (
                      <div
                        key={record.id}
                        className={`text-xs px-2 py-1 rounded-full ${getGradeColor(record.grade)}`}
                        title={`${record.student.firstName} ${record.student.lastName}: ${record.grade}%`}
                      >
                        {record.student.firstName} {record.student.lastName.charAt(0)}.: {record.grade}%
                      </div>
                    ))}
                    {dayGrades.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayGrades.length - 2} more
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
          Please select both a class and subject to view grade history.
        </div>
      ) : null}
    </div>
  );
};

export default TeacherGradeTracker;
