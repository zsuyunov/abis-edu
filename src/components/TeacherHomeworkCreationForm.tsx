"use client";

import { useState, useRef } from "react";

interface TeacherHomeworkCreationFormProps {
  teacherId: string;
  timetable: {
    id: string;
    class: { id: string; name: string; academicYear?: { id: number } };
    subject: { id: string; name: string };
    branch: { id: string; shortName: string };
    fullDate: string;
  };
  onClose: () => void;
  onHomeworkCreated: () => void;
}

const TeacherHomeworkCreationForm = ({
  teacherId,
  timetable,
  onClose,
  onHomeworkCreated,
}: TeacherHomeworkCreationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    totalPoints: "",
    passingPoints: "",
    assignedDate: new Date().toISOString().split('T')[0],
    assignedTime: "09:00", // Default to 9:00 AM
    dueDate: "",
    dueTime: "23:59", // Default to 11:59 PM
    allowLateSubmission: true,
    latePenaltyPerDay: "10",
  });

  const [attachments, setAttachments] = useState<{
    images: File[];
    files: File[];
    voiceMessages: File[];
  }>({
    images: [],
    files: [],
    voiceMessages: [],
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const handleFileUpload = (type: 'images' | 'files' | 'voiceMessages', files: FileList | null) => {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `voice-message-${Date.now()}.wav`, { type: 'audio/wav' });
        setAttachments(prev => ({
          ...prev,
          voiceMessages: [...prev.voiceMessages, file]
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('teacherId', teacherId);
      formDataToSend.append('classId', timetable.class.id);
      formDataToSend.append('subjectId', timetable.subject.id);
      formDataToSend.append('branchId', timetable.branch.id);
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
      formDataToSend.append('latePenaltyPerDay', formData.latePenaltyPerDay);

      // Add files
      attachments.images.forEach((file, index) => {
        formDataToSend.append(`images`, file);
      });
      attachments.files.forEach((file, index) => {
        formDataToSend.append(`files`, file);
      });
      attachments.voiceMessages.forEach((file, index) => {
        formDataToSend.append(`voiceMessages`, file);
      });

      const response = await fetch("/api/teacher-homework/with-files", {
        method: "POST",
        headers: {
          'x-user-id': teacherId,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Homework creation response:', result);
        setSuccessMessage(`Homework "${formData.title}" created successfully!`);
        setTimeout(() => {
          onHomeworkCreated();
          onClose();
        }, 1500);
      } else {
        const error = await response.json();
        console.error("Failed to create homework:", error);
        alert(`Failed to create homework: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'mp3':
      case 'wav': return '🎵';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  return (
    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Homework</h2>
            <p className="text-sm text-gray-600 mt-1">
              {timetable.class.name} • {timetable.subject.name} • {timetable.branch.shortName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Homework Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter homework title..."
          />
        </div>

        {/* Points Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Points
            </label>
            <input
              type="number"
              name="totalPoints"
              value={formData.totalPoints}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passing Points
            </label>
            <input
              type="number"
              name="passingPoints"
              value={formData.passingPoints}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="60"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the homework assignment..."
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Direct Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide detailed instructions for students..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              name="assignedDate"
              value={formData.assignedDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
              min={formData.assignedDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              name="assignedTime"
              value={formData.assignedTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              When students can start working on this homework
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Time *
            </label>
            <input
              type="time"
              name="dueTime"
              value={formData.dueTime}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the time when homework is due (default: 11:59 PM)
            </p>
          </div>
        </div>


        {/* Late Submission Settings */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Allow Late Submissions</span>
            </label>
          </div>
          {formData.allowLateSubmission && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Penalty (% deduction per day)
              </label>
              <input
                type="number"
                name="latePenaltyPerDay"
                value={formData.latePenaltyPerDay}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
            </div>
          )}
        </div>

        {/* File Attachments */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
          
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Attach Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload('images', e.target.files)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {attachments.images.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.images.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-sm text-blue-800">🖼️ {file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment('images', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 Attach Files (PDF, DOC, etc.)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf"
              multiple
              onChange={(e) => handleFileUpload('files', e.target.files)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {attachments.files.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                    <span className="text-sm text-green-800">{getFileIcon(file.name)} {file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment('files', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice Messages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎵 Voice Messages
            </label>
            
            {/* Recording Controls */}
            <div className="flex items-center gap-3 mb-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Record Voice Message
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm">{formatRecordingTime(recordingTime)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    Stop Recording
                  </button>
                </div>
              )}
            </div>

            {/* File Upload Alternative */}
            <div className="text-sm text-gray-500 mb-2">Or upload existing audio files:</div>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => handleFileChange(e, 'voiceMessages')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {attachments.voiceMessages.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.voiceMessages.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-purple-700">{file.name}</span>
                      <span className="text-xs text-purple-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment('voiceMessages', index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg flex items-center gap-2 font-medium"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? "Creating..." : "Create Homework"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherHomeworkCreationForm;
