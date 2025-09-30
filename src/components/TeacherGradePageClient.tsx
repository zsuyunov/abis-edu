"use client";

import { useState, useEffect } from 'react';
import TeacherGradebookGrid from './TeacherGradebookGrid';

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

interface TeacherGradePageClientProps {
  teacherClasses: TeacherClass[];
  teacherSubjects: TeacherSubject[];
  academicYears: AcademicYear[];
  branches: Branch[];
  teacherId: string;
}

const TeacherGradePageClient: React.FC<TeacherGradePageClientProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches,
  teacherId
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for grade save events to refresh the grid
  useEffect(() => {
    const handleGradeSaved = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Listen for custom events or use a simple interval-based refresh
    window.addEventListener('gradeSaved', handleGradeSaved);
    
    return () => {
      window.removeEventListener('gradeSaved', handleGradeSaved);
    };
  }, []);

  return (
    <TeacherGradebookGrid 
      teacherClasses={teacherClasses}
      teacherSubjects={teacherSubjects}
      teacherId={teacherId}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default TeacherGradePageClient;
