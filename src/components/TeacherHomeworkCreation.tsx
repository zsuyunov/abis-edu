"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface TeacherHomeworkCreationProps {
  teacherId: string;
  teacherData: any;
  onHomeworkCreated: () => void;
  onCancel?: () => void;
  isMobile?: boolean;
  editHomeworkId?: number | null;
}

const TeacherHomeworkCreation = ({
  teacherId,
  teacherData,
  onHomeworkCreated,
  onCancel,
  isMobile,
  editHomeworkId,
}: TeacherHomeworkCreationProps) => {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!editHomeworkId);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    assignedDate: new Date().toISOString().split('T')[0],
    assignedTime: "09:00",
    dueDate: "",
    dueTime: "23:59",
    branchId: teacherData?.teacher?.branch?.id || "",
    academicYearId: "",
    classId: "",
    subjectId: "",
    totalPoints: "",
    passingGrade: "",
    allowLateSubmission: true,
    latePenalty: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  // Load homework data for editing
  useEffect(() => {
    if (editHomeworkId && isEditMode) {
      fetchHomeworkForEdit();
    }
  }, [editHomeworkId, isEditMode]);

  const fetchHomeworkForEdit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher-homework?id=${editHomeworkId}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const homework = data.homework[0]; // Assuming single homework response
        
        if (homework) {
          const assignedDateTime = homework.assignedDate ? new Date(homework.assignedDate) : new Date();
          const dueDateTime = homework.dueDate ? new Date(homework.dueDate) : new Date();
          
          setFormData({
            title: homework.title || "",
            description: homework.description || "",
            instructions: homework.instructions || "",
            assignedDate: assignedDateTime.toISOString().split('T')[0],
            assignedTime: assignedDateTime.toTimeString().slice(0, 5),
            dueDate: dueDateTime.toISOString().split('T')[0],
            dueTime: dueDateTime.toTimeString().slice(0, 5),
            branchId: homework.branchId?.toString() || "",
            academicYearId: homework.academicYearId?.toString() || "",
            classId: homework.classId?.toString() || "",
            subjectId: homework.subjectId?.toString() || "",
            totalPoints: homework.totalPoints?.toString() || "",
            passingGrade: homework.passingGrade?.toString() || "",
            allowLateSubmission: homework.allowLateSubmission ?? true,
            latePenalty: homework.latePenalty?.toString() || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching homework for edit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First upload attachments if any
      let uploadedAttachments: any[] = [];
      
      if (attachments.length > 0) {
        const formDataForUpload = new FormData();
        attachments.forEach((file, index) => {
          formDataForUpload.append(`attachments`, file);
        });
        formDataForUpload.append('teacherId', teacherId);
        
        const uploadResponse = await fetch('/api/upload-attachments', {
          method: 'POST',
          headers: {
            'x-user-id': teacherId,
          },
          body: formDataForUpload,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedAttachments = uploadResult.attachments || [];
          console.log('Attachments uploaded successfully:', uploadedAttachments);
        } else {
          const uploadError = await uploadResponse.json();
          console.error('Failed to upload attachments:', uploadError);
          alert(`Failed to upload attachments: ${uploadError.error || 'Unknown error'}`);
          return; // Don't proceed if attachment upload fails
        }
      }

      const url = isEditMode ? `/api/teacher-homework?id=${editHomeworkId}` : "/api/teacher-homework";
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": teacherId,
        },
        body: JSON.stringify({
          ...formData,
          teacherId,
          assignedDate: new Date(`${formData.assignedDate}T${formData.assignedTime}:00`).toISOString(),
          dueDate: new Date(`${formData.dueDate}T${formData.dueTime}:00`).toISOString(),
          branchId: parseInt(formData.branchId),
          academicYearId: parseInt(formData.academicYearId),
          classId: parseInt(formData.classId),
          subjectId: parseInt(formData.subjectId),
          totalPoints: formData.totalPoints ? parseFloat(formData.totalPoints) : null,
          passingGrade: formData.passingGrade ? parseFloat(formData.passingGrade) : null,
          latePenalty: formData.latePenalty ? parseFloat(formData.latePenalty) : null,
          attachments: uploadedAttachments,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Homework creation successful:', result);
        onHomeworkCreated();
      } else {
        const error = await response.json();
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} homework:`, error);
        alert(`Failed to ${isEditMode ? 'update' : 'create'} homework: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} homework:`, error);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Edit Homework' : 'Create New Homework'}
              </h3>
              <p className="text-sm text-gray-600">
                {isEditMode ? 'Update your homework assignment' : 'Design engaging homework assignments for your students'}
              </p>
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
                    {cls.name} ({cls.students?.length || 0} students)
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
              <label htmlFor="assignedTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                id="assignedTime"
                name="assignedTime"
                value={formData.assignedTime}
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

            <div>
              <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                id="dueTime"
                name="dueTime"
                value={formData.dueTime}
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
            Attachments
          </h4>
          
          <div className="space-y-4">
            {/* Image Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 Attach Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Document Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📄 Attach Files (PDF, DOC, etc.)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                onChange={(e) => handleFileUpload(e, 'document')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Voice Message Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎤 Attach Voice Messages
              </label>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => handleFileUpload(e, 'audio')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Show Selected Files */}
            {attachments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">Selected Files ({attachments.length})</h5>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {file.type.startsWith('image/') ? '🖼️' : 
                           file.type.startsWith('audio/') ? '🎤' : '📄'}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4">
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
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Homework" : "Create Homework")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherHomeworkCreation;
