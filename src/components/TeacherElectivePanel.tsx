import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeacherElectiveGroupSelector from './TeacherElectiveGroupSelector';
import ElectiveStudentsList from './ElectiveStudentsList';

interface ElectiveGroup {
  id: number;
  name: string;
  description?: string;
  branch: {
    id: number;
    shortName: string;
    name: string;
  };
  academicYear: {
    id: number;
    name: string;
  };
  subjects: ElectiveSubject[];
  totalStudents: number;
}

interface ElectiveSubject {
  id: number;
  subjectId: number;
  subjectName: string;
  maxStudents?: number;
  description?: string;
  studentCount: number;
  students: ElectiveStudent[];
}

interface ElectiveStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  originalClass: string;
  classId?: number;
}

interface TeacherElectivePanelProps {
  teacherId: string;
  academicYearId?: number;
  branchId?: number;
  onActionSelect?: (action: 'attendance' | 'homework' | 'grades', data: {
    electiveGroup: ElectiveGroup;
    electiveSubject: ElectiveSubject;
    students: ElectiveStudent[];
  }) => void;
}

const TeacherElectivePanel: React.FC<TeacherElectivePanelProps> = ({
  teacherId,
  academicYearId,
  branchId,
  onActionSelect
}) => {
  const [selectedGroup, setSelectedGroup] = useState<ElectiveGroup | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ElectiveSubject | null>(null);
  const [currentView, setCurrentView] = useState<'groups' | 'students' | 'actions'>('groups');
  const [students, setStudents] = useState<ElectiveStudent[]>([]);

  const handleGroupSelect = (group: ElectiveGroup, subject: ElectiveSubject) => {
    setSelectedGroup(group);
    setSelectedSubject(subject);
    setStudents(subject.students);
    setCurrentView('students');
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setSelectedSubject(null);
    setStudents([]);
    setCurrentView('groups');
  };

  const handleActionSelect = (action: 'attendance' | 'homework' | 'grades') => {
    if (selectedGroup && selectedSubject && onActionSelect) {
      onActionSelect(action, {
        electiveGroup: selectedGroup,
        electiveSubject: selectedSubject,
        students: students
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'attendance': return '✅';
      case 'homework': return '📝';
      case 'grades': return '📊';
      default: return '📚';
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'attendance': return 'Mark attendance for all students in this elective group';
      case 'homework': return 'Assign homework to all students in this elective group';
      case 'grades': return 'Enter grades for all students in this elective group';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📚 Elective Groups Management</h2>
            <p className="text-blue-100 mt-1">
              Manage attendance, homework, and grades for your elective subjects
            </p>
          </div>
          {selectedGroup && (
            <button
              onClick={handleBackToGroups}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Groups</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {currentView === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TeacherElectiveGroupSelector
                teacherId={teacherId}
                onGroupSelect={handleGroupSelect}
                academicYearId={academicYearId}
                branchId={branchId}
              />
            </motion.div>
          )}

          {currentView === 'students' && selectedGroup && selectedSubject && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Selected Group Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📖</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedGroup.name} - {selectedSubject.subjectName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>🏢 {selectedGroup.branch.shortName}</span>
                      <span>📅 {selectedGroup.academicYear.name}</span>
                      <span>👥 {selectedSubject.studentCount} students</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['attendance', 'homework', 'grades'].map((action) => (
                  <motion.button
                    key={action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleActionSelect(action as 'attendance' | 'homework' | 'grades')}
                    className="p-4 bg-white border-2 border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                        {getActionIcon(action)}
                      </div>
                      <h4 className="font-medium text-gray-800 capitalize mb-1">{action}</h4>
                      <p className="text-xs text-gray-600">
                        {getActionDescription(action)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Students List */}
              <ElectiveStudentsList
                teacherId={teacherId}
                electiveSubjectId={selectedSubject.id}
                showSearch={true}
                className="mt-6"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>📚 Elective Management System</span>
            {selectedGroup && (
              <span>• Current: {selectedGroup.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherElectivePanel;
