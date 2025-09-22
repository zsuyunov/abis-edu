"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TeacherAttendanceGrid from './TeacherAttendanceGrid';

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

interface TeacherAttendancePageClientProps {
  teacherId: string;
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
}

const TeacherAttendancePageClient: React.FC<TeacherAttendancePageClientProps> = ({
  teacherId,
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for attendance save events to refresh the grid
  useEffect(() => {
    const handleAttendanceSaved = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Listen for custom events or use a simple interval-based refresh
    window.addEventListener('attendanceSaved', handleAttendanceSaved);
    
    return () => {
      window.removeEventListener('attendanceSaved', handleAttendanceSaved);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <TeacherAttendanceGrid 
        teacherId={teacherId}
        teacherClasses={teacherClasses}
        teacherSubjects={teacherSubjects}
        academicYears={academicYears}
        branches={branches}
        refreshTrigger={refreshTrigger}
      />
    </motion.div>
  );
};

export default TeacherAttendancePageClient;
