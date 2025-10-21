import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

interface TeacherElectiveGroupSelectorProps {
  teacherId: string;
  onGroupSelect: (group: ElectiveGroup, subject: ElectiveSubject) => void;
  selectedGroupId?: number;
  selectedSubjectId?: number;
  academicYearId?: number;
  branchId?: number;
}

const TeacherElectiveGroupSelector: React.FC<TeacherElectiveGroupSelectorProps> = ({
  teacherId,
  onGroupSelect,
  selectedGroupId,
  selectedSubjectId,
  academicYearId,
  branchId
}) => {
  const [electiveGroups, setElectiveGroups] = useState<ElectiveGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchElectiveGroups();
  }, [teacherId, academicYearId, branchId]);

  const fetchElectiveGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (academicYearId) params.append('academicYearId', academicYearId.toString());
      if (branchId) params.append('branchId', branchId.toString());

      const response = await fetch(`/api/teacher-elective-groups?${params}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setElectiveGroups(data.data || []);
        
        // Auto-expand if there's a selected group
        if (selectedGroupId) {
          setExpandedGroups(new Set([selectedGroupId]));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch elective groups');
      }
    } catch (err) {
      console.error('Error fetching elective groups:', err);
      setError('Failed to fetch elective groups');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpansion = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSubjectSelect = (group: ElectiveGroup, subject: ElectiveSubject) => {
    onGroupSelect(group, subject);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin text-4xl">📚</div>
        <span className="ml-3 text-gray-600">Loading elective groups...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-2">⚠️</span>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchElectiveGroups}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (electiveGroups.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-gray-800 font-medium mb-2">No Elective Groups Found</h3>
        <p className="text-gray-600 text-sm">
          You don't have any elective subjects assigned to you yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          📚 Your Elective Groups ({electiveGroups.length})
        </h3>
        <button
          onClick={fetchElectiveGroups}
          className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-3">
        {electiveGroups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
          >
            {/* Group Header */}
            <div
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
              onClick={() => toggleGroupExpansion(group.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {expandedGroups.has(group.id) ? '📖' : '📚'}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-800">{group.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>🏢 {group.branch.shortName}</span>
                      <span>📅 {group.academicYear.name}</span>
                      <span>👥 {group.totalStudents} students</span>
                      <span>📖 {group.subjects.length} subjects</span>
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedGroups.has(group.id) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400"
                >
                  ⌄
                </motion.div>
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mt-2 ml-11">{group.description}</p>
              )}
            </div>

            {/* Subjects List */}
            {expandedGroups.has(group.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-100"
              >
                <div className="p-4 space-y-2">
                  {group.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGroupId === group.id && selectedSubjectId === subject.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                      }`}
                      onClick={() => handleSubjectSelect(group, subject)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">📖</span>
                          <div>
                            <h5 className="font-medium text-gray-800">{subject.subjectName}</h5>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <span>👥 {subject.studentCount} students</span>
                              {subject.maxStudents && (
                                <span>📊 Max: {subject.maxStudents}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedGroupId === group.id && selectedSubjectId === subject.id && (
                          <span className="text-blue-500 text-xl">✓</span>
                        )}
                      </div>
                      {subject.description && (
                        <p className="text-sm text-gray-600 mt-2 ml-8">{subject.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeacherElectiveGroupSelector;
