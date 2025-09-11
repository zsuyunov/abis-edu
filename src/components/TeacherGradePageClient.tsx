"use client";

import { useState, useEffect } from 'react';
import TeacherGradeGrid from './TeacherGradeGrid';

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
}

const TeacherGradePageClient: React.FC<TeacherGradePageClientProps> = ({
  teacherClasses,
  teacherSubjects,
  academicYears,
  branches
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
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Grade Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and track grades for your classes and subjects
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4">
        <TeacherGradeGrid 
          teacherClasses={teacherClasses}
          teacherSubjects={teacherSubjects}
          academicYears={academicYears}
          branches={branches}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default TeacherGradePageClient;
