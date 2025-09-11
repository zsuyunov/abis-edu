"use client";

import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { createGrade, updateGrade } from "@/lib/actions";

interface GradeFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: (open: boolean) => void;
  relatedData?: any;
}

const GradeForm = ({ type, data, setOpen, relatedData }: GradeFormProps) => {
  const [state, formAction] = useFormState(
    type === "create" ? createGrade : updateGrade,
    { success: false, error: false }
  );

  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // Get current user ID from localStorage or context
    const userId = localStorage.getItem("userId") || "";
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      // You might want to refresh the page or update the UI here
      window.location.reload();
    }
  }, [state, setOpen]);

  const handleSubmit = (formData: FormData) => {
    // Convert FormData to the expected object format
    const gradeData = {
      studentId: formData.get("studentId") as string,
      subjectId: parseInt(formData.get("subjectId") as string),
      type: formData.get("type") as "DAILY" | "WEEKLY" | "MONTHLY" | "TERMLY" | "YEARLY" | "EXAM_MIDTERM" | "EXAM_FINAL" | "EXAM_NATIONAL",
      value: parseFloat(formData.get("value") as string),
      maxValue: parseInt(formData.get("maxValue") as string),
      date: new Date(formData.get("date") as string),
      description: formData.get("description") as string || "",
      teacherId: currentUserId,
      branchId: relatedData?.branchId || 1, // Default branch ID
      classId: relatedData?.classId || 1, // Default class ID
      academicYearId: relatedData?.academicYearId || 1, // Default academic year ID
      status: "ACTIVE" as const,
      year: new Date().getFullYear(),
    };

    // Add ID for update operations
    if (type === "update" && data?.id) {
      (gradeData as any).id = parseInt(data.id);
    }

    formAction(gradeData as any);
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-8">
      {/* Hidden inputs */}
      <input type="hidden" name="currentUserId" value={currentUserId} />
      {type === "update" && <input type="hidden" name="id" value={data?.id} />}

      {/* Student Selection */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Student</label>
        <select
          name="studentId"
          defaultValue={data?.studentId || ""}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          required
        >
          <option value="">Select Student</option>
          {relatedData?.students?.map((student: any) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Selection */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Subject</label>
        <select
          name="subjectId"
          defaultValue={data?.subjectId || ""}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          required
        >
          <option value="">Select Subject</option>
          {relatedData?.subjects?.map((subject: any) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Type */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Grade Type</label>
        <select
          name="type"
          defaultValue={data?.type || "DAILY"}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          required
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="TERMLY">Termly</option>
          <option value="YEARLY">Yearly</option>
          <option value="EXAM_MIDTERM">Midterm Exam</option>
          <option value="EXAM_FINAL">Final Exam</option>
          <option value="EXAM_NATIONAL">National Exam</option>
        </select>
      </div>

      {/* Score */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Score</label>
        <input
          type="number"
          name="value"
          defaultValue={data?.value || ""}
          min="0"
          max="100"
          step="0.1"
          placeholder="Enter score (0-100)"
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          required
        />
      </div>

      {/* Max Value */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Max Value</label>
        <input
          type="number"
          name="maxValue"
          defaultValue={data?.maxValue || "100"}
          min="1"
          max="1000"
          placeholder="Maximum possible score"
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          required
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={data?.date ? new Date(data.date).toISOString().split('T')[0] : ""}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          required
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-4">
        <label className="text-xs text-gray-500">Description (Optional)</label>
        <textarea
          name="description"
          defaultValue={data?.description || ""}
          rows={3}
          placeholder="Add any notes or feedback..."
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        />
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
          Something went wrong! Please try again.
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        {type === "create" ? "Create Grade" : "Update Grade"}
      </button>
    </form>
  );
};

export default GradeForm;
