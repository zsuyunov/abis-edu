"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Save, 
  FileText, 
  Calendar, 
  Clock, 
  Upload, 
  Camera, 
  Mic, 
  Image as ImageIcon
} from "lucide-react";

interface Homework {
  id: number;
  title: string;
  description: string;
  fullMark: number;
  passingMark: number;
  givenDate: string;
  dueDate: string;
  penaltyPercent: number;
  enablePenalty: boolean;
  status: string;
  class: { id: number; name: string };
  subject: { id: number; name: string };
  branch: { id: number; shortName: string };
}

interface HomeworkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework;
  onUpdate: () => void;
}

const HomeworkEditModal = ({ isOpen, onClose, homework, onUpdate }: HomeworkEditModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fullMark: "",
    passingMark: "",
    givenDate: "",
    dueDate: "",
    penaltyPercent: "10",
    enablePenalty: true,
  });
  
  const [attachments, setAttachments] = useState<{
    images: File[];
    documents: File[];
    voices: File[];
  }>({ images: [], documents: [], voices: [] });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (homework && isOpen) {
      setFormData({
        title: homework.title,
        description: homework.description,
        fullMark: homework.fullMark.toString(),
        passingMark: homework.passingMark.toString(),
        givenDate: new Date(homework.givenDate).toISOString().slice(0, 16),
        dueDate: new Date(homework.dueDate).toISOString().slice(0, 16),
        penaltyPercent: homework.penaltyPercent.toString(),
        enablePenalty: homework.enablePenalty,
      });
    }
  }, [homework, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/homework/${homework.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ...formData,
          fullMark: parseInt(formData.fullMark),
          passingMark: parseInt(formData.passingMark),
          penaltyPercent: parseInt(formData.penaltyPercent),
          givenDate: new Date(formData.givenDate).toISOString(),
          dueDate: new Date(formData.dueDate).toISOString(),
        })
      });

      if (response.ok) {
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error("Error updating homework:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        setAttachments(prev => ({ ...prev, voices: [...prev.voices, file] }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const removeAttachment = (type: 'images' | 'documents' | 'voices', index: number) => {
    setAttachments(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Homework</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {homework.class.name} - {homework.subject.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Homework Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe the homework assignment in detail"
              />
            </div>
          </div>

          {/* Marks & Dates */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Marks & Timeline
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Mark *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.fullMark}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullMark: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="100"
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
                  value={formData.passingMark}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingMark: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="60"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Given Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.givenDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, givenDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Due Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Penalty Settings */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Late Submission Penalty</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enablePenalty}
                  onChange={(e) => setFormData(prev => ({ ...prev, enablePenalty: e.target.checked }))}
                  className="w-5 h-5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Penalty</span>
              </label>
            </div>
            
            {formData.enablePenalty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penalty Percentage (per day late)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.penaltyPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, penaltyPercent: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="10"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Students will lose {formData.penaltyPercent || 0}% of their grade for each day the assignment is late
                </p>
              </div>
            )}
          </div>

          {/* Mobile-Style Attachments */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Update Attachments
            </h3>
            
            {/* Attachment Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Images */}
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105"
                >
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">Images</span>
                </button>
              </div>
              
              {/* Documents */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all transform hover:scale-105"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Documents</span>
                </button>
              </div>
              
              {/* Voice Recording */}
              <div>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all transform hover:scale-105 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">
                    {isRecording ? formatTime(recordingTime) : 'Voice'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Attachment Preview */}
            <div className="space-y-3">
              {/* Images */}
              {attachments.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    New Images ({attachments.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {attachments.images.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                          <ImageIcon className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                          <p className="text-xs text-gray-600 truncate">{file.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment('images', index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Documents */}
              {attachments.documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    New Documents ({attachments.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {attachments.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment('documents', index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Voice Messages */}
              {attachments.voices.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Mic className="w-4 h-4" />
                    New Voice Messages ({attachments.voices.length})
                  </h4>
                  <div className="space-y-2">
                    {attachments.voices.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment('voices', index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Homework
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkEditModal;
