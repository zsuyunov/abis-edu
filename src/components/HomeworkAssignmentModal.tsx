"use client";

import { useState } from "react";
import Image from "next/image";

interface TimetableEntry {
  id: string;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    shortName: string;
  };
}

interface HomeworkAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: TimetableEntry | null;
  onSave: (homeworkData: any) => void;
}

const HomeworkAssignmentModal = ({ isOpen, onClose, timetable, onSave }: HomeworkAssignmentModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    totalPoints: "",
    allowLateSubmission: true,
    latePenalty: "",
    passingGrade: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetable) return;

    setIsSubmitting(true);
    try {
      const homeworkData = {
        ...formData,
        classId: parseInt(timetable.class.id),
        subjectId: parseInt(timetable.subject.id),
        branchId: parseInt(timetable.branch.id),
        attachments,
      };
      
      await onSave(homeworkData);
      onClose();
      setFormData({
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        totalPoints: "",
        allowLateSubmission: true,
        latePenalty: "",
        passingGrade: "",
      });
      setAttachments([]);
    } catch (error) {
      console.error("Error saving homework:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen || !timetable) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Assign Homework</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Image src="/close.svg" alt="Close" width={20} height={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {timetable.class.name} - {timetable.subject.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Homework Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter homework title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the homework assignment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide detailed instructions for students"
            />
          </div>

          {/* Grading Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grading Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Points
                </label>
                <input
                  type="number"
                  value={formData.totalPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPoints: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Grade (%)
                </label>
                <input
                  type="number"
                  value={formData.passingGrade}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingGrade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Penalty (%)
                </label>
                <input
                  type="number"
                  value={formData.latePenalty}
                  onChange={(e) => setFormData(prev => ({ ...prev, latePenalty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* File Attachments */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp3,.mp4,.wav"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Image src="/upload.svg" alt="Upload" width={32} height={32} />
                <span className="mt-2 text-sm text-gray-600">
                  Click to upload files or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PDF, DOC, DOCX, TXT, JPG, PNG, MP3, MP4, WAV
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Image src="/delete.svg" alt="Remove" width={16} height={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border-t pt-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={(e) => setFormData(prev => ({ ...prev, allowLateSubmission: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowLateSubmission" className="ml-2 text-sm text-gray-700">
                Allow late submissions
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Assigning..." : "Assign Homework"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkAssignmentModal;
