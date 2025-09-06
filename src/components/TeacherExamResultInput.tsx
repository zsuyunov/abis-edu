"use client";

import React from "react";

interface TeacherExamResultInputProps {
  selectedExam: any;
  students: any[];
  onResultSubmit: (resultData: any) => void;
  onBulkResultSubmit: (bulkData: any) => void;
}

const TeacherExamResultInput = ({
  selectedExam,
  students,
  onResultSubmit,
  onBulkResultSubmit,
}: TeacherExamResultInputProps) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Exam Result Input</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Input exam results for {selectedExam?.name}
        </p>
        <div className="mt-4">
          <p>This component will display:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Student list with score input fields</li>
            <li>Pass/fail calculation</li>
            <li>Feedback input</li>
            <li>Bulk result submission</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeacherExamResultInput;
