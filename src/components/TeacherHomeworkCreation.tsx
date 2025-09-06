"use client";

import { useState } from "react";
import Image from "next/image";

interface TeacherHomeworkCreationProps {
  teacherId: string;
  teacherData: any;
  onHomeworkCreated: () => void;
  onCancel: () => void;
}

const TeacherHomeworkCreation = ({
  teacherId,
  teacherData,
  onHomeworkCreated,
  onCancel,
}: TeacherHomeworkCreationProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    branchId: teacherData?.teacher?.branch?.id || "",
    academicYearId: "",
    classId: "",
    subjectId: "",
    totalPoints: "",
    passingGrade: "",
    allowLateSubmission: true,
    latePenalty: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/teacher-homework", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          teacherId,
          branchId: parseInt(formData.branchId),
          academicYearId: parseInt(formData.academicYearId),
          classId: parseInt(formData.classId),
          subjectId: parseInt(formData.subjectId),
          totalPoints: formData.totalPoints ? parseFloat(formData.totalPoints) : null,
          passingGrade: formData.passingGrade ? parseFloat(formData.passingGrade) : null,
          latePenalty: formData.latePenalty ? parseFloat(formData.latePenalty) : null,
        }),
      });

      if (response.ok) {
        onHomeworkCreated();
      } else {
        const error = await response.json();
        console.error("Error creating homework:", error);
      }
    } catch (error) {
      console.error("Error creating homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Image src="/create.png" alt="Create" width={20} height={20} className="invert" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Homework</h3>
              <p className="text-sm text-gray-600">Design engaging homework assignments for your students</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Image src="/close.png" alt="Close" width={24} height={24} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📝</span>
            Basic Information
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Homework Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter homework title..."
              />
            </div>
            
            <div>
              <label htmlFor="totalPoints" className="block text-sm font-medium text-gray-700 mb-2">
                Total Points
              </label>
              <input
                type="number"
                id="totalPoints"
                name="totalPoints"
                value={formData.totalPoints}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the homework..."
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide detailed instructions for students..."
            />
          </div>
        </div>

        {/* Assignment Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>🎯</span>
            Assignment Details
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="academicYearId" className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                id="academicYearId"
                name="academicYearId"
                value={formData.academicYearId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Academic Year</option>
                {teacherData?.availableAcademicYears?.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                id="classId"
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Class</option>
                {teacherData?.assignedClasses?.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.students.length} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                id="subjectId"
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Subject</option>
                {teacherData?.assignedSubjects?.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="passingGrade" className="block text-sm font-medium text-gray-700 mb-2">
                Passing Grade
              </label>
              <input
                type="number"
                id="passingGrade"
                name="passingGrade"
                value={formData.passingGrade}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 60"
              />
            </div>
          </div>
        </div>

        {/* Dates and Deadlines */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📅</span>
            Dates and Deadlines
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedDate" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Date *
              </label>
              <input
                type="date"
                id="assignedDate"
                name="assignedDate"
                value={formData.assignedDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submission Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>⚙️</span>
            Submission Settings
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowLateSubmission"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowLateSubmission" className="ml-2 block text-sm text-gray-900">
                Allow Late Submissions
              </label>
            </div>

            {formData.allowLateSubmission && (
              <div>
                <label htmlFor="latePenalty" className="block text-sm font-medium text-gray-700 mb-2">
                  Late Penalty (%)
                </label>
                <input
                  type="number"
                  id="latePenalty"
                  name="latePenalty"
                  value={formData.latePenalty}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="5"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 10"
                />
                <span className="ml-2 text-sm text-gray-600">% deducted per day late</span>
              </div>
            )}
          </div>
        </div>

        {/* Multimedia Attachments */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📎</span>
            Attachments (Coming Soon)
          </h4>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Image src="/upload.png" alt="Upload" width={48} height={48} className="mx-auto opacity-50" />
            </div>
            <p className="text-gray-500 text-sm">
              Multimedia attachment support (images, documents, audio, video) will be available soon.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create Homework"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherHomeworkCreation;
