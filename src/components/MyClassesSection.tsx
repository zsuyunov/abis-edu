"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, BarChart3, ChevronRight } from 'lucide-react';

interface Assignment {
  id: string;
  role: string;
  Class: {
    id: string;
    name: string;
    branch?: {
      shortName: string;
    };
  };
  Subject?: {
    id: string;
    name: string;
  };
  Branch: {
    id: string;
    shortName: string;
  };
  AcademicYear: {
    id: string;
    name: string;
  };
}

interface MyClassesSectionProps {
  assignments: Assignment[];
}

const MyClassesSection: React.FC<MyClassesSectionProps> = ({ assignments }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Get unique subjects from assignments
  const uniqueSubjects = useMemo(() => {
    const subjects = assignments
      .map(a => a.Subject?.name)
      .filter(Boolean) as string[];
    return Array.from(new Set(subjects));
  }, [assignments]);

  // Subject color mapping
  const getSubjectStyle = (subjectName: string) => {
    const colors = {
      'MATHEMATICS': { bg: 'bg-red-500', glow: 'shadow-red-200' },
      'PHYSICS': { bg: 'bg-blue-500', glow: 'shadow-blue-200' },
      'CHEMISTRY': { bg: 'bg-green-500', glow: 'shadow-green-200' },
      'BIOLOGY': { bg: 'bg-emerald-500', glow: 'shadow-emerald-200' },
      'ENGLISH': { bg: 'bg-purple-500', glow: 'shadow-purple-200' },
      'HISTORY': { bg: 'bg-orange-500', glow: 'shadow-orange-200' },
      'GEOGRAPHY': { bg: 'bg-teal-500', glow: 'shadow-teal-200' },
      'COMPUTER SCIENCE': { bg: 'bg-indigo-500', glow: 'shadow-indigo-200' },
      'CHESS': { bg: 'bg-gray-700', glow: 'shadow-gray-200' },
      'ROBOTICS': { bg: 'bg-pink-500', glow: 'shadow-pink-200' },
    };
    
    return colors[subjectName as keyof typeof colors] || { 
      bg: 'bg-gray-500', 
      glow: 'shadow-gray-200' 
    };
  };

  return (
    <motion.div
      key="assignments"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">My Classes</h2>
            <p className="text-blue-100 text-xs sm:text-sm">Select a subject to view your assigned classes</p>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold">{uniqueSubjects.length}</div>
            <div className="text-blue-100 text-xs sm:text-sm">Subjects</div>
          </div>
        </div>
      </motion.div>

      {/* Subject Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Select Subject</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {uniqueSubjects.map((subject, index) => {
            const subjectColors = getSubjectStyle(subject);
            const isSelected = selectedSubject === subject;
            
            return (
              <motion.button
                key={subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSubject(isSelected ? null : subject)}
                className={`p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? `${subjectColors.bg} border-transparent text-white shadow-lg` 
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-white/20' : subjectColors.bg
                  }`}>
                    <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-white' : 'text-white'}`} />
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm">{subject}</h4>
                  <p className="text-xs mt-1 opacity-75">
                    {assignments.filter(a => a.Subject?.name === subject).length} classes
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Classes Display */}
      {selectedSubject && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">{selectedSubject} Classes</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Your assigned classes for this subject</p>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {assignments.filter(a => a.Subject?.name === selectedSubject).length}
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">Classes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {assignments
              .filter(assignment => assignment.Subject?.name === selectedSubject)
              .map((assignment, index) => {
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: '#f8fafc'
                    }}
                    className="group bg-white border border-gray-200 rounded-lg p-1.5 sm:p-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 sm:space-x-1.5">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-700">C</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-900 truncate">{assignment.Class.name}</h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-0.5 sm:space-x-1">
                        <span className={`px-1 py-0.5 text-xs font-medium rounded-full ${
                          assignment.role === 'TEACHER' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {assignment.role === 'TEACHER' ? 'T' : 'S'}
                        </span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!selectedSubject && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Select a Subject</h3>
          <p className="text-gray-500 text-sm sm:text-base">Choose a subject above to view your assigned classes</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MyClassesSection;
