"use client";

import { useState, useEffect } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import Image from "next/image";
import VoiceRecorder from "./VoiceRecorder";

interface TeacherHomeworkCreationProps {
  teacherId: string;
  teacherData: any;
  onHomeworkCreated: () => void;
  onCancel?: () => void;
  isMobile?: boolean;
  editHomeworkId?: number | null;
  selectedLesson?: any; // Add selected lesson prop
}

const TeacherHomeworkCreation = ({
  teacherId,
  teacherData,
  onHomeworkCreated,
  onCancel,
  isMobile,
  editHomeworkId,
  selectedLesson,
}: TeacherHomeworkCreationProps) => {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!editHomeworkId);
  // Initialize form data with proper defaults
  const getInitialFormData = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      title: "",
      description: "",
      instructions: "",
      assignedDate: today.toISOString().split('T')[0],
      assignedTime: "09:00",
      dueDate: nextWeek.toISOString().split('T')[0],
      dueTime: "23:59",
      branchId: teacherData?.teacher?.branch?.id || "",
      classId: "",
      subjectId: "",
      totalPoints: "",
      passingPoints: "",
      allowLateSubmission: true,
      latePenalty: "",
      enableLatePenalty: false,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [attachments, setAttachments] = useState<{
    images: File[];
    files: File[];
    voiceMessages: File[];
  }>({
    images: [],
    files: [],
    voiceMessages: [],
  });

  // Load homework data for editing
  useEffect(() => {
    if (editHomeworkId && isEditMode) {
      fetchHomeworkForEdit();
    }
  }, [editHomeworkId, isEditMode]);

  // Debug teacher data
  useEffect(() => {
    console.log('TeacherHomeworkCreation - teacherData:', teacherData);
    console.log('TeacherHomeworkCreation - assignedClasses:', teacherData?.assignedClasses);
    console.log('TeacherHomeworkCreation - assignedSubjects:', teacherData?.assignedSubjects);
  }, [teacherData]);

  // Pre-populate form when lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      console.log('Pre-populating form with selected lesson:', selectedLesson);
      setFormData(prev => ({
        ...prev,
        branchId: selectedLesson.branch?.id || selectedLesson.class?.branch?.id || "",
        classId: selectedLesson.class?.id || "",
        subjectId: selectedLesson.subjects?.[0]?.id || selectedLesson.subject?.id || "",
        // Don't pre-fill title, description, or instructions - let user fill them
      }));
    }
  }, [selectedLesson]);

  const fetchHomeworkForEdit = async () => {
    try {
      setLoading(true);
      const response = await csrfFetch(`/api/teacher-homework?id=${editHomeworkId}`, {
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
            classId: homework.classId?.toString() || "",
            subjectId: homework.subjectId?.toString() || "",
            totalPoints: homework.totalPoints?.toString() || "",
            passingPoints: homework.passingGrade?.toString() || "",
            allowLateSubmission: homework.allowLateSubmission ?? true,
            latePenalty: homework.latePenalty?.toString() || "",
            enableLatePenalty: !!homework.latePenalty, // Enable if late penalty exists
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

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a homework title');
      setLoading(false);
      return;
    }

    if (!formData.dueDate) {
      alert('Please select a due date');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file uploads (like dashboard)
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('teacherId', teacherId);
      formDataToSend.append('classId', formData.classId);
      formDataToSend.append('subjectId', formData.subjectId);
      formDataToSend.append('branchId', formData.branchId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('totalPoints', formData.totalPoints);
      formDataToSend.append('passingPoints', formData.passingPoints);
      formDataToSend.append('assignedDate', formData.assignedDate);
      
      // Combine date and time for due date
      const dueDateTime = formData.dueDate && formData.dueTime 
        ? `${formData.dueDate}T${formData.dueTime}:00` 
        : formData.dueDate;
      formDataToSend.append('dueDate', dueDateTime);
      formDataToSend.append('allowLateSubmission', formData.allowLateSubmission.toString());
      formDataToSend.append('latePenaltyPerDay', formData.latePenalty || '0');

      // Add files directly to FormData (like dashboard)
      attachments.images.forEach((file) => {
        formDataToSend.append('images', file);
      });
      attachments.files.forEach((file) => {
        formDataToSend.append('files', file);
      });
      attachments.voiceMessages.forEach((file) => {
        formDataToSend.append('voiceMessages', file);
      });

      console.log('Submitting homework with FormData (like dashboard)');
      console.log('Images count:', attachments.images.length);
      console.log('Files count:', attachments.files.length);
      console.log('Voice messages count:', attachments.voiceMessages.length);

      const response = await csrfFetch("/api/teacher-homework/with-files", {
        method: "POST",
        headers: {
          'x-user-id': teacherId,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Homework creation successful:', result);
        onHomeworkCreated();
      } else {
        const error = await response.json();
        console.error(`Error creating homework:`, error);
        alert(`Failed to create homework: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error creating homework:`, error);
      alert('An error occurred while creating homework. Please try again.');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'files' | 'voiceMessages') => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    setAttachments(prev => ({
      ...prev,
      [type]: [...prev[type], ...fileArray]
    }));
  };

  const removeAttachment = (type: 'images' | 'files' | 'voiceMessages', index: number) => {
    setAttachments(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
    setAttachments(prev => ({
      ...prev,
      voiceMessages: [...prev.voiceMessages, file]
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

      {/* Selected Lesson Info */}
      {selectedLesson && (
        <div className="px-6 py-4 bg-green-50 border-b border-green-200">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span className="text-lg">📚</span>
            Selected Lesson
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-800">Class:</span> {selectedLesson.class?.name || 'Unknown Class'}
            </div>
            <div>
              <span className="font-medium text-green-800">Subject:</span> {selectedLesson.subjects?.[0]?.name || selectedLesson.subject?.name || 'Unknown Subject'}
            </div>
            <div>
              <span className="font-medium text-green-800">Branch:</span> {selectedLesson.branch?.shortName || selectedLesson.class?.branch?.shortName || 'Unknown Branch'}
            </div>
            <div>
              <span className="font-medium text-green-800">Time:</span> {selectedLesson.startTime} - {selectedLesson.endTime}
            </div>
            {selectedLesson.roomNumber || selectedLesson.buildingName ? (
              <div className="md:col-span-2">
                <span className="font-medium text-green-800">Room:</span> {selectedLesson.roomNumber || selectedLesson.buildingName}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📝</span>
            Basic Information
          </h4>
          
          <div className="grid md:grid-cols-3 gap-4">
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

            <div>
              <label htmlFor="passingPoints" className="block text-sm font-medium text-gray-700 mb-2">
                Passing Points
              </label>
              <input
                type="number"
                id="passingPoints"
                name="passingPoints"
                value={formData.passingPoints}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 60"
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

        {/* Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>⚙️</span>
            Settings
          </h4>
          
          <div className="space-y-4">
            {/* Enable Late Penalty Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label htmlFor="enableLatePenalty" className="text-sm font-medium text-gray-900">
                  Enable Late Penalty
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Apply a percentage penalty for late submissions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="enableLatePenalty"
                  name="enableLatePenalty"
                  checked={formData.enableLatePenalty}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    enableLatePenalty: e.target.checked,
                    latePenalty: e.target.checked ? prev.latePenalty : ""
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Late Penalty Input - Only show when enabled */}
            {formData.enableLatePenalty && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the percentage penalty to apply for late submissions (0-100%)
                </p>
              </div>
            )}
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
                onChange={(e) => handleFileChange(e, 'images')}
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
                onChange={(e) => handleFileChange(e, 'files')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Voice Recording */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎤 Record Voice Messages
              </label>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecordingComplete}
                disabled={loading}
              />
            </div>

            {/* Voice File Upload (Alternative) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📁 Or Upload Voice Files
              </label>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => handleFileChange(e, 'voiceMessages')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Show Selected Files */}
            {(attachments.images.length > 0 || attachments.files.length > 0 || attachments.voiceMessages.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">
                  Selected Files ({attachments.images.length + attachments.files.length + attachments.voiceMessages.length})
                </h5>
                <div className="space-y-2">
                  {/* Images */}
                  {attachments.images.map((file, index) => (
                    <div key={`image-${index}`} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🖼️</span>
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment('images', index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  {/* Files */}
                  {attachments.files.map((file, index) => (
                    <div key={`file-${index}`} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment('files', index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  {/* Voice Messages */}
                  {attachments.voiceMessages.map((file, index) => (
                    <div key={`voice-${index}`} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎤</span>
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment('voiceMessages', index)}
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
