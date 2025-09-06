"use client";

import React from "react";

interface TeacherGradeInputProps {
  students: any[];
  selectedClass: any;
  selectedSubject: any;
  onGradeSubmit: (gradeData: any) => void;
  onBulkGradeSubmit: (bulkData: any) => void;
}

const TeacherGradeInput = ({
  students,
  selectedClass,
  selectedSubject,
  onGradeSubmit,
  onBulkGradeSubmit,
}: TeacherGradeInputProps) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Grade Input</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Input grades for {selectedClass?.name} - {selectedSubject?.name}
        </p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Student list with grade input fields</li>
            <li>Bulk grade entry options</li>
            <li>Grade validation and submission</li>
            <li>Auto-save functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeacherGradeInput;
