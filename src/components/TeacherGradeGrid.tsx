"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, BookOpen, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface GradeRecord {
  id: string;
  date: string;
  value: number;
  description?: string;
  studentId: string;
}

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

interface TeacherGradeGridProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
  refreshTrigger?: number;
}

const TeacherGradeGrid: React.FC<TeacherGradeGridProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches,
  refreshTrigger
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeData, setGradeData] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/students/by-class?classId=${selectedClass}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchGradeData = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClass.toString(),
        subjectId: selectedSubject.toString(),
        month: format(currentDate, 'yyyy-MM'),
        ...(selectedAcademicYear && { academicYearId: selectedAcademicYear }),
        ...(selectedBranch && { branchId: selectedBranch })
      });

      const response = await fetch(`/api/grades?${params}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Grades API Response:', result);
        const gradeRecords = result.grades || result.data?.grades || result.data || result;
        setGradeData(Array.isArray(gradeRecords) ? gradeRecords : []);
      }
    } catch (error) {
      console.error('Error fetching grade data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    fetchGradeData();
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedBranch, currentDate, refreshTrigger]);

  const getGradeForStudentAndDate = (studentId: string, date: Date) => {
    if (!Array.isArray(gradeData)) return undefined;
    return gradeData.find(record => 
      record.studentId === studentId && 
      format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getGradeColor = (value: number | undefined) => {
    if (value === undefined) return 'bg-gray-50 border-gray-200';
    if (value >= 90) return 'bg-green-100 border-green-300 text-green-800';
    if (value >= 80) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (value >= 70) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (value >= 60) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  const getAverageGrade = (grades: GradeRecord[]) => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
    return Math.round(sum / grades.length);
  };

  const getStudentAverage = (studentId: string) => {
    const studentGrades = gradeData.filter(grade => grade.studentId === studentId);
    return getAverageGrade(studentGrades);
  };

  const getClassAverage = () => {
    if (gradeData.length === 0) return 0;
    const sum = gradeData.reduce((acc, grade) => acc + grade.value, 0);
    return Math.round(sum / gradeData.length);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            📊 Grade Tracking
          </h2>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Statistics */}
        {selectedClass && selectedSubject && gradeData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">Total Grades</h4>
              <p className="text-2xl font-bold text-blue-900">{gradeData.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">Class Average</h4>
              <p className="text-2xl font-bold text-green-900">{getAverageGrade(gradeData)}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-700">Highest Grade</h4>
              <p className="text-2xl font-bold text-yellow-900">
                {gradeData.length > 0 ? Math.max(...gradeData.map(g => g.value)) : 0}%
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">Lowest Grade</h4>
              <p className="text-2xl font-bold text-red-900">
                {gradeData.length > 0 ? Math.min(...gradeData.map(g => g.value)) : 0}%
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedClass && selectedSubject ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[140px] sm:min-w-[200px]">
                    Student
                  </th>
                  <th className="sticky left-[140px] sm:left-[200px] z-10 bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[60px] sm:min-w-[80px]">
                    Average
                  </th>
                  {monthDays.map(day => (
                    <th key={day.toISOString()} className="px-1 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[40px] sm:min-w-[60px]">
                      <div className="text-xs sm:text-sm">{format(day, 'dd')}</div>
                      <div className="text-xs text-gray-400 hidden sm:block">{format(day, 'EEE')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => {
                  const studentAvg = getStudentAverage(student.id);
                  return (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="sticky left-0 z-10 bg-inherit px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[140px] sm:min-w-[200px]">
                        <div className="truncate font-medium">{student.firstName} {student.lastName}</div>
                        <div className="truncate text-xs text-gray-500 mt-1">{student.studentId}</div>
                      </td>
                      <td className={`sticky left-[140px] sm:left-[200px] z-10 bg-inherit px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-center border-r border-gray-200 min-w-[60px] sm:min-w-[80px] ${getGradeColor(studentAvg > 0 ? studentAvg : undefined)}`}>
                        {studentAvg > 0 ? `${studentAvg}%` : '-'}
                      </td>
                      {monthDays.map(day => {
                        const grade = getGradeForStudentAndDate(student.id, day);
                        return (
                          <td key={day.toISOString()} className={`px-1 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium border-r border-gray-200 min-w-[40px] sm:min-w-[60px] ${getGradeColor(grade?.value)}`}>
                            {grade ? `${grade.value}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select both a class and subject to view grade history.
        </div>
      )}

      {/* Legend */}
      {selectedClass && selectedSubject && (
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>90-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>80-89%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>70-79%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span>60-69%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Below 60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>No Grade</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TeacherGradeGrid;
