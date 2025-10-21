import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ElectiveStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  originalClass: string;
  classId?: number;
}

interface ElectiveStudentGroup {
  electiveGroupId: number;
  electiveGroupName: string;
  electiveSubjectId: number;
  electiveSubjectName: string;
  students: ElectiveStudent[];
}

interface ElectiveStudentsListProps {
  teacherId: string;
  electiveGroupId?: number;
  electiveSubjectId?: number;
  subjectId?: number;
  onStudentSelect?: (student: ElectiveStudent) => void;
  selectedStudentIds?: string[];
  showSelection?: boolean;
  showSearch?: boolean;
  className?: string;
}

const ElectiveStudentsList: React.FC<ElectiveStudentsListProps> = ({
  teacherId,
  electiveGroupId,
  electiveSubjectId,
  subjectId,
  onStudentSelect,
  selectedStudentIds = [],
  showSelection = false,
  showSearch = true,
  className = ''
}) => {
  const [studentGroups, setStudentGroups] = useState<ElectiveStudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<ElectiveStudent[]>([]);

  useEffect(() => {
    if (electiveGroupId || electiveSubjectId || subjectId) {
      fetchElectiveStudents();
    }
  }, [teacherId, electiveGroupId, electiveSubjectId, subjectId]);

  useEffect(() => {
    // Filter students based on search term
    const allStudents = studentGroups.flatMap(group => group.students);
    if (searchTerm.trim() === '') {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.originalClass.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [studentGroups, searchTerm]);

  const fetchElectiveStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (electiveGroupId) params.append('electiveGroupId', electiveGroupId.toString());
      if (electiveSubjectId) params.append('electiveSubjectId', electiveSubjectId.toString());
      if (subjectId) params.append('subjectId', subjectId.toString());

      const response = await fetch(`/api/teacher-elective-students?${params}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudentGroups(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching elective students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: ElectiveStudent) => {
    if (onStudentSelect) {
      onStudentSelect(student);
    }
  };

  const formatStudentId = (studentId: string) => {
    // Format student ID as S37845 style
    if (studentId.startsWith('S') || studentId.startsWith('s')) {
      return studentId.toUpperCase();
    }
    return `S${studentId}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin text-4xl">👥</div>
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-2">⚠️</span>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchElectiveStudents}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (studentGroups.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-gray-800 font-medium mb-2">No Students Found</h3>
        <p className="text-gray-600 text-sm">
          No students are assigned to the selected elective group/subject.
        </p>
      </div>
    );
  }

  const totalStudents = filteredStudents.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          👥 Students ({totalStudents})
        </h3>
        <button
          onClick={fetchElectiveStudents}
          className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search students by name, ID, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>No students match your search criteria</p>
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border transition-all ${
                showSelection && selectedStudentIds.includes(student.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
              } ${onStudentSelect ? 'cursor-pointer' : ''}`}
              onClick={() => handleStudentClick(student)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">{student.fullName}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-mono">
                        {formatStudentId(student.studentId)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>🏫 {student.originalClass}</span>
                    </div>
                  </div>
                </div>
                {showSelection && selectedStudentIds.includes(student.id) && (
                  <span className="text-blue-500 text-xl">✓</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary by Group */}
      {studentGroups.length > 1 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">📊 Summary by Group</h4>
          <div className="space-y-2">
            {studentGroups.map((group) => (
              <div key={`${group.electiveGroupId}-${group.electiveSubjectId}`} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {group.electiveGroupName} - {group.electiveSubjectName}
                </span>
                <span className="font-medium text-gray-800">
                  {group.students.length} students
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectiveStudentsList;
