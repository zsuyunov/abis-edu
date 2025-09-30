'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  branch?: {
    shortName: string;
  };
}

interface TeacherAssignment {
  id: number;
  role: 'TEACHER' | 'SUPERVISOR';
  Class: Class;
  Subject?: Subject;
  Branch: {
    id: number;
    shortName: string;
  };
  AcademicYear: {
    id: number;
    name: string;
  };
}

interface TeacherDashboardCardProps {
  teacher: Teacher;
  assignments: TeacherAssignment[];
}

// Color mapping for different subjects
const getSubjectColor = (subjectName: string) => {
  const name = subjectName.toLowerCase();
  
  if (name.includes('drama') || name.includes('music')) {
    return {
      bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      text: 'text-white',
      light: 'bg-purple-50',
      border: 'border-purple-200'
    };
  }
  if (name.includes('math') || name.includes('mathematics')) {
    return {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      text: 'text-white',
      light: 'bg-blue-50',
      border: 'border-blue-200'
    };
  }
  if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) {
    return {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      text: 'text-white',
      light: 'bg-green-50',
      border: 'border-green-200'
    };
  }
  if (name.includes('english') || name.includes('language') || name.includes('literature')) {
    return {
      bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      text: 'text-white',
      light: 'bg-indigo-50',
      border: 'border-indigo-200'
    };
  }
  if (name.includes('history') || name.includes('social')) {
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
      text: 'text-white',
      light: 'bg-amber-50',
      border: 'border-amber-200'
    };
  }
  if (name.includes('art') || name.includes('drawing') || name.includes('painting')) {
    return {
      bg: 'bg-gradient-to-r from-pink-500 to-pink-600',
      text: 'text-white',
      light: 'bg-pink-50',
      border: 'border-pink-200'
    };
  }
  if (name.includes('pe') || name.includes('physical') || name.includes('sport')) {
    return {
      bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
      text: 'text-white',
      light: 'bg-orange-50',
      border: 'border-orange-200'
    };
  }
  
  // Default color for other subjects
  return {
    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
    text: 'text-white',
    light: 'bg-gray-50',
    border: 'border-gray-200'
  };
};

// Extract year from class name
const extractYear = (className: string): number => {
  const match = className.match(/year\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
};

const TeacherDashboardCard: React.FC<TeacherDashboardCardProps> = ({ teacher, assignments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  // Filter assignments based on search term
  const filteredAssignments = useMemo(() => {
    if (!searchTerm) return assignments;
    
    return assignments.filter(assignment => {
      const className = assignment.Class.name.toLowerCase();
      const subjectName = assignment.Subject?.name.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return className.includes(searchLower) || subjectName.includes(searchLower);
    });
  }, [assignments, searchTerm]);

  // Group assignments by year
  const assignmentsByYear = useMemo(() => {
    const grouped = new Map<number, TeacherAssignment[]>();
    
    filteredAssignments.forEach(assignment => {
      const year = extractYear(assignment.Class.name);
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(assignment);
    });
    
    // Sort years in ascending order
    return new Map(Array.from(grouped.entries()).sort(([a], [b]) => a - b));
  }, [filteredAssignments]);

  // Toggle year expansion
  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  // Expand all years
  const expandAll = () => {
    setExpandedYears(new Set(assignmentsByYear.keys()));
  };

  // Collapse all years
  const collapseAll = () => {
    setExpandedYears(new Set());
  };

  // Get teacher initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Teacher Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {getInitials(teacher.firstName, teacher.lastName)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            {/* Teacher Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {teacher.firstName} {teacher.lastName}
              </h2>
              <p className="text-gray-600 font-medium">
                {teacher.role || 'Subject Teacher'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {assignments.length} assigned classes
              </p>
            </div>
          </div>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-white/80 hover:bg-white transition-colors shadow-sm border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
          
          {/* Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Assignments Content */}
      <div className="p-6">
        {assignmentsByYear.size === 0 ? (
          <div className="text-center py-12">
            <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No classes assigned yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(assignmentsByYear.entries()).map(([year, yearAssignments]) => {
              const isExpanded = expandedYears.has(year);
              
              return (
                <div key={year} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Year Header */}
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Year {year}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {yearAssignments.length} classes
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {/* Year Content */}
                  {isExpanded && (
                    <div className="p-6 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {yearAssignments.map((assignment) => {
                          const subjectColors = assignment.Subject 
                            ? getSubjectColor(assignment.Subject.name)
                            : getSubjectColor('Unknown');
                          
                          return (
                            <div
                              key={assignment.id}
                              className="group hover:scale-105 transition-transform duration-200"
                            >
                              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Class Name */}
                                <div className="mb-3">
                                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 truncate">
                                      {assignment.Class.name}
                                    </p>
                                    {assignment.Branch?.shortName && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        {assignment.Branch.shortName}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Subject Name */}
                                {assignment.Subject && (
                                  <div className={`px-3 py-2 ${subjectColors.bg} rounded-lg`}>
                                    <p className={`text-sm font-medium ${subjectColors.text} truncate`}>
                                      {assignment.Subject.name}
                                    </p>
                                  </div>
                                )}
                                
                                {/* Role Badge */}
                                <div className="mt-3 flex justify-between items-center">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    assignment.role === 'SUPERVISOR' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {assignment.role === 'SUPERVISOR' ? 'Supervisor' : 'Teacher'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboardCard;
