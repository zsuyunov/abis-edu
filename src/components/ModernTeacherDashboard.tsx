'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Settings, 
  LogOut, 
  Calendar,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Edit3,
  CheckCircle,
  Star,
  Bell,
} from 'lucide-react';
import OptimizedTeacherScheduleDashboard from './OptimizedTeacherScheduleDashboard';
import MyClassesSection from './MyClassesSection';
import ProfileUpdateModal from './ProfileUpdateModal';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
  avatar?: string;
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

interface ModernTeacherDashboardProps {
  teacher: Teacher;
  assignments: TeacherAssignment[];
}

// Enhanced color system for subjects
const getSubjectStyle = (subjectName: string) => {
  const name = subjectName.toLowerCase();
  
  if (name.includes('drama') || name.includes('music')) {
    return {
      bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      glow: 'hover:shadow-purple-200'
    };
  }
  if (name.includes('math') || name.includes('mathematics')) {
    return {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      glow: 'hover:shadow-blue-200'
    };
  }
  if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) {
    return {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      light: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      glow: 'hover:shadow-green-200'
    };
  }
  if (name.includes('english') || name.includes('language') || name.includes('literature')) {
    return {
      bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      light: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      glow: 'hover:shadow-indigo-200'
    };
  }
  if (name.includes('history') || name.includes('social')) {
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
      light: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      glow: 'hover:shadow-amber-200'
    };
  }
  if (name.includes('art') || name.includes('drawing') || name.includes('painting')) {
    return {
      bg: 'bg-gradient-to-r from-pink-500 to-pink-600',
      light: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      glow: 'hover:shadow-pink-200'
    };
  }
  if (name.includes('pe') || name.includes('physical') || name.includes('sport')) {
    return {
      bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      glow: 'hover:shadow-orange-200'
    };
  }
  
  return {
    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
    light: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    glow: 'hover:shadow-gray-200'
  };
};

// Extract year from class name
const extractYear = (className: string): number => {
  const match = className.match(/year\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
};

// Get teacher initials
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Sample calendar data
const generateCalendarData = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  return {
    month: currentMonth,
    year: currentYear,
    today: today.getDate(),
    events: [
      {
        id: 1,
        date: today.getDate(),
        time: '08:30 - 09:10',
        class: 'Year 9 KS 3 - Said Ahmad Siddiqiy Ajzy',
        subject: 'Drama/Music',
        classroom: 'KS - Classroom',
        status: 'No lesson topic set',
        color: 'purple'
      },
      {
        id: 2,
        date: today.getDate(),
        time: '09:20 - 10:00',
        class: 'Year 7 KS 3 - Tavallo',
        subject: 'Drama/Music',
        classroom: 'KS - Classroom',
        status: 'Topic: Introduction to Drama',
        color: 'purple'
      }
    ]
  };
};

const ModernTeacherDashboard: React.FC<ModernTeacherDashboardProps> = ({ 
  teacher, 
  assignments 
}) => {
  // Removed unused state variables for the new My Classes interface
  const [activeTab, setActiveTab] = useState<'assignments' | 'calendar'>('calendar');
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const calendarData = generateCalendarData();

  // Removed unused computed values and functions for the new My Classes interface

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Teacher Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {getInitials(teacher.firstName, teacher.lastName)}
                </span>
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">{teacher.firstName} {teacher.lastName}</h1>
                <p className="text-xs text-gray-500 -mt-1">{teacher.role || 'Subject Teacher'}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'assignments' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Classes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'calendar' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                Schedule
              </motion.button>
            </div>

            {/* Profile Button */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileModal(true)}
                className="group relative p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-lg"
                title="Update Profile"
              >
                <Settings className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'assignments' 
                  ? 'text-blue-600 border-blue-600 bg-blue-50' 
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              My Assignments
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'calendar' 
                  ? 'text-blue-600 border-blue-600 bg-blue-50' 
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Schedule
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'assignments' ? (
          <MyClassesSection assignments={assignments.map(assignment => ({
            id: assignment.id.toString(),
            role: assignment.role,
            Class: {
              id: assignment.Class.id.toString(),
              name: assignment.Class.name,
              branch: assignment.Branch ? {
                shortName: assignment.Branch.shortName
              } : undefined
            },
            Subject: assignment.Subject ? {
              id: assignment.Subject.id.toString(),
              name: assignment.Subject.name
            } : undefined,
            Branch: {
              id: assignment.Branch.id.toString(),
              shortName: assignment.Branch.shortName
            },
            AcademicYear: {
              id: assignment.AcademicYear.id.toString(),
              name: assignment.AcademicYear.name
            }
          }))} />
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Use the original OptimizedTeacherScheduleDashboard for calendar functionality */}
            <OptimizedTeacherScheduleDashboard 
              teacherId={teacher.id}
              teacherData={{
                id: teacher.id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                phone: '',
                TeacherAssignment: assignments.map(assignment => ({
                  ...assignment,
                  id: assignment.id.toString(),
                  Branch: {
                    id: assignment.Branch.id.toString(),
                    name: assignment.Branch.shortName,
                    shortName: assignment.Branch.shortName
                  },
                  Class: {
                    ...assignment.Class,
                    id: assignment.Class.id.toString(),
                    branch: {
                      id: assignment.Branch.id.toString(),
                      name: assignment.Class.branch?.shortName || ''
                    },
                    academicYear: {
                      ...assignment.AcademicYear,
                      id: assignment.AcademicYear.id.toString()
                    }
                  },
                  Subject: assignment.Subject ? {
                    id: assignment.Subject.id.toString(),
                    name: assignment.Subject.name
                  } : null,
                  AcademicYear: {
                    ...assignment.AcademicYear,
                    id: assignment.AcademicYear.id.toString()
                  }
                }))
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="grid grid-cols-4 h-16">
          {[
            { icon: BookOpen, label: 'Dashboard', active: true },
            { icon: Calendar, label: 'Calendar', active: false },
            { icon: Users, label: 'Assignments', active: false },
            { icon: Settings, label: 'Settings', active: false }
          ].map((item, index) => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center space-y-1 ${
                item.active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Profile Update Modal */}
      <ProfileUpdateModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        teacherId={teacher.id}
        currentPhone={''}
        onUpdateSuccess={() => {
          console.log("Profile updated successfully");
        }}
      />
    </div>
  );
};

export default ModernTeacherDashboard;
