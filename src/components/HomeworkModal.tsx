"use client";

import { useState, useRef } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import { X, Upload, FileText, Image as ImageIcon, Mic, Calendar, Clock, Target, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: {
    id: string;
    classId: string;
    subjectId: string;
    academicYearId: string;
    branchId: string;
    className: string;
    subjectName: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  teacherId: string;
}

interface AttachmentFile {
  file: File;
  type: 'image' | 'document' | 'voice';
  preview?: string;
}

const HomeworkModal: React.FC<HomeworkModalProps> = ({
  isOpen,
  onClose,
  lessonData,
  teacherId,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fullMark: 100,
    passingMark: 60,
    startDate: '',
    startTime: '',
    submissionDate: '',
    submissionTime: '',
    allowLateSubmission: true,
    latePenalty: 10
  });
  
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document' | 'voice') => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const attachment: AttachmentFile = {
        file,
        type
      };

      // Create preview for images
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, attachment]);
      }
    });

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4" />;
    if (type === 'voice') return <Mic className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add homework data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('fullMark', formData.fullMark.toString());
      formDataToSend.append('passingMark', formData.passingMark.toString());
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('startTime', formData.startTime);
      formDataToSend.append('submissionDate', formData.submissionDate);
      formDataToSend.append('submissionTime', formData.submissionTime);
      formDataToSend.append('allowLateSubmission', formData.allowLateSubmission.toString());
      formDataToSend.append('latePenalty', formData.latePenalty.toString());
      
      // Add lesson context
      formDataToSend.append('timetableId', lessonData.id);
      formDataToSend.append('classId', lessonData.classId);
      formDataToSend.append('subjectId', lessonData.subjectId);
      formDataToSend.append('academicYearId', lessonData.academicYearId);
      formDataToSend.append('branchId', lessonData.branchId);
      
      // Add attachments
      attachments.forEach((attachment, index) => {
        formDataToSend.append(`attachments`, attachment.file);
        formDataToSend.append(`attachmentTypes`, attachment.type);
      });

      const response = await csrfFetch('/api/teacher-homework', {
        method: 'POST',
        headers: {
          'x-user-id': teacherId,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        alert('Homework created successfully!');
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          fullMark: 100,
          passingMark: 60,
          startDate: '',
          startTime: '',
          submissionDate: '',
          submissionTime: '',
          allowLateSubmission: true,
          latePenalty: 10
        });
        setAttachments([]);
      } else {
        const error = await response.json();
        alert(`Failed to create homework: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      alert('An error occurred while creating homework. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  console.log('HomeworkModal rendering with comprehensive form');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🚀 COMPREHENSIVE HOMEWORK CREATOR 🚀</h2>
              <p className="text-orange-100 mt-1">
                {lessonData.subjectName} - {lessonData.className}
              </p>
              <p className="text-orange-200 text-sm">
                {new Date(lessonData.date).toLocaleDateString()} • {lessonData.startTime} - {lessonData.endTime}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-600 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Homework Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter homework title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Provide detailed description and instructions for the homework"
                  />
                </div>
              </div>
            </div>

            {/* Grading Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                Grading Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Mark *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="1000"
                    value={formData.fullMark}
                    onChange={(e) => handleInputChange('fullMark', parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Mark *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.fullMark}
                    value={formData.passingMark}
                    onChange={(e) => handleInputChange('passingMark', parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late Penalty (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.latePenalty}
                    onChange={(e) => handleInputChange('latePenalty', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time Settings */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Schedule Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date & Time */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    Start Date & Time
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Submission Date & Time */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    Submission Deadline
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.submissionDate}
                        onChange={(e) => handleInputChange('submissionDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.submissionTime}
                        onChange={(e) => handleInputChange('submissionTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Late Submission Setting */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => handleInputChange('allowLateSubmission', e.target.checked)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow late submissions (with penalty)
                  </span>
                </label>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-600" />
                Attachments
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Images */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 transition-colors flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Upload Images</span>
                    <span className="text-xs text-gray-500">JPG, PNG, GIF</span>
                  </button>
                </div>

                {/* Documents */}
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    onChange={(e) => handleFileUpload(e, 'document')}
                    className="hidden"
                    id="document-upload"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('document-upload')?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 transition-colors flex flex-col items-center gap-2"
                  >
                    <FileText className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Upload Documents</span>
                    <span className="text-xs text-gray-500">PDF, DOC, PPT, XLS</span>
                  </button>
                </div>

                {/* Voice Messages */}
                <div>
                  <input
                    ref={voiceInputRef}
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'voice')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => voiceInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 transition-colors flex flex-col items-center gap-2"
                  >
                    <Mic className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Upload Voice</span>
                    <span className="text-xs text-gray-500">MP3, WAV, M4A</span>
                  </button>
                </div>
              </div>

              {/* Attachment List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Attached Files ({attachments.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                        {attachment.preview ? (
                          <img src={attachment.preview} alt="Preview" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            {getFileIcon(attachment.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.file.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {attachment.type} • {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Homework'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeworkModal;
