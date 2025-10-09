"use client";

import React, { useState, useEffect } from 'react';
import { csrfFetch } from '@/hooks/useCsrfToken';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Upload, X, Image, FileText, Mic, Play, Square, Trash2, ArrowLeft, Calendar } from 'lucide-react';
import ImageKitUpload from './ImageKitUpload';

interface TeacherData {
  assignedClasses: Array<{
    id: string;
    name: string;
    branch: {
      id: string;
      shortName: string;
    };
  }>;
  assignedSubjects: Array<{
    id: string;
    name: string;
  }>;
}

interface HomeworkFormData {
  title: string;
  description: string;
  instructions: string;
  startDate: string;
  startTime: string;
  dueDate: string;
  dueTime: string;
  totalMarks: string;
  passingMarks: string;
  attachments: Array<{
    fileName: string;
    originalName: string;
    fileUrl: string;
    filePath: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
  }>;
}

interface ModernHomeworkCreationProps {
  teacherId: string;
  teacherData: TeacherData;
  onHomeworkCreated: () => void;
  onCancel: () => void;
  selectedClass?: string;
  selectedSubject?: string;
}

const ModernHomeworkCreation: React.FC<ModernHomeworkCreationProps> = ({
  teacherId,
  teacherData,
  onHomeworkCreated,
  onCancel,
  selectedClass = '',
  selectedSubject = '',
}) => {
  const [localSelectedClass, setLocalSelectedClass] = useState<string>(selectedClass);
  const [localSelectedSubject, setLocalSelectedSubject] = useState<string>(selectedSubject);
  const [formData, setFormData] = useState<HomeworkFormData>({
    title: '',
    description: '',
    instructions: '',
    startDate: '',
    startTime: '09:00',
    dueDate: '',
    dueTime: '23:59',
    totalMarks: '',
    passingMarks: '',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<'image' | 'document' | 'voice' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      dueDate: nextWeek.toISOString().split('T')[0],
    }));
  }, []);

  const handleInputChange = (field: keyof HomeworkFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUploadSuccess = (result: any) => {
    const newAttachment = {
      fileName: result.fileName || result.name,
      originalName: result.originalName || result.fileName || result.name,
      fileUrl: result.fileUrl || result.url,
      filePath: result.filePath || result.fileUrl || result.url,
      fileType: result.fileType,
      mimeType: result.mimeType || result.fileType,
      fileSize: result.fileSize || result.size,
    };
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment],
    }));
    
    // Reset selected type after successful upload
    setSelectedAttachmentType(null);
  };

  const handleAttachmentTypeSelect = (type: 'image' | 'document' | 'voice') => {
    setSelectedAttachmentType(type);
    if (type !== 'voice') {
      setIsRecording(false);
      setRecordedAudio(null);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const saveRecording = async () => {
    if (recordedAudio) {
      // Convert blob to file for upload
      const file = new File([recordedAudio], `voice-recording-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      
      try {
        // Upload the voice recording using the existing upload-attachments API
        const formData = new FormData();
        formData.append('attachments', file);
        
        const response = await csrfFetch('/api/upload-attachments', {
          method: 'POST',
          headers: {
            'x-user-id': teacherId,
          },
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.attachments && result.attachments.length > 0) {
            const attachment = result.attachments[0];
            handleFileUploadSuccess(attachment);
            setRecordedAudio(null);
          } else {
            throw new Error('Upload failed');
          }
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading voice recording:', error);
        alert('Error uploading voice recording. Please try again.');
      }
    }
  };

  const discardRecording = () => {
    setRecordedAudio(null);
    setAudioChunks([]);
    setIsRecording(false);
  };

  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localSelectedClass || !localSelectedSubject || !formData.title || !formData.description || !formData.startDate || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create homework with already uploaded attachments
      const homeworkData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        startDate: formData.startDate,
        startTime: formData.startTime,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        totalMarks: formData.totalMarks ? parseFloat(formData.totalMarks) : null,
        passingMarks: formData.passingMarks ? parseFloat(formData.passingMarks) : null,
        classId: localSelectedClass,
        subjectId: localSelectedSubject,
        attachments: formData.attachments,
      };

      const response = await csrfFetch('/api/teacher-homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': teacherId,
        },
        body: JSON.stringify(homeworkData),
      });

      if (response.ok) {
        onHomeworkCreated();
      } else {
        const error = await response.json();
        alert(`Error creating homework: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      alert('Error creating homework. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClassData = teacherData.assignedClasses.find(c => c.id === localSelectedClass);
  const selectedSubjectData = teacherData.assignedSubjects.find(s => s.id === localSelectedSubject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Create Homework</h2>
              <p className="text-blue-100">Create a new homework assignment for your class</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Selection
            </motion.button>
          </div>
        </motion.div>
        
        {/* Selected Class and Subject Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Selected Class */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <label className="text-sm font-medium text-blue-700">Selected Class</label>
              </div>
              <div className="text-lg font-semibold text-blue-900">
                {selectedClassData ? selectedClassData.name : 'No class selected'}
              </div>
            </div>

            {/* Selected Subject */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center mb-2">
                <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                <label className="text-sm font-medium text-green-700">Selected Subject</label>
              </div>
              <div className="text-lg font-semibold text-green-900">
                {selectedSubjectData ? selectedSubjectData.name : 'No subject selected'}
              </div>
            </div>
          </div>
        </motion.div>


        {/* Homework Creation Form */}
        <AnimatePresence>
          {selectedClass && selectedSubject && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Form Header */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create Homework</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedClassData?.name} • {selectedSubjectData?.name}
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Homework Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter homework title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the homework assignment"
                    required
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide detailed instructions for students"
                  />
                </div>

                {/* Total Marks and Passing Marks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) => handleInputChange('totalMarks', e.target.value)}
                      placeholder="Enter total marks"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      value={formData.passingMarks}
                      onChange={(e) => handleInputChange('passingMarks', e.target.value)}
                      placeholder="Enter passing marks"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Start Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Due Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => handleInputChange('dueTime', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  
                  {/* Upload Type Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <motion.button
                      type="button"
                      onClick={() => handleAttachmentTypeSelect('image')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl transition-colors ${
                        selectedAttachmentType === 'image'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <Image className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Image Attach</span>
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => handleAttachmentTypeSelect('document')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl transition-colors ${
                        selectedAttachmentType === 'document'
                          ? 'border-green-500 bg-green-50'
                          : 'border-green-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Document Attach</span>
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => handleAttachmentTypeSelect('voice')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl transition-colors ${
                        selectedAttachmentType === 'voice'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-purple-300 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                    >
                      <Mic className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Voice Record</span>
                    </motion.button>
                  </div>

                  {/* Upload Area - Only show when type is selected */}
                  {selectedAttachmentType && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6"
                    >
                      {selectedAttachmentType === 'voice' ? (
                        // Voice Recording Interface
                        <div className="text-center">
                          {!recordedAudio ? (
                            // Recording Interface
                            <div>
                              <div className="mb-4">
                                <Mic className={`w-12 h-12 mx-auto mb-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-purple-500'}`} />
                                <p className="text-sm text-gray-600 mb-2">
                                  {isRecording ? 'Recording...' : 'Tap to start recording'}
                                </p>
                                {isRecording && (
                                  <div className="text-lg font-mono text-red-500">
                                    {formatTime(recordingTime)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-center gap-4">
                                {!isRecording ? (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={startRecording}
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                                  >
                                    <Mic className="w-5 h-5" />
                                    Start Recording
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                  >
                                    <Square className="w-5 h-5" />
                                    Stop Recording
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          ) : (
                            // Recording Playback Interface
                            <div>
                              <div className="mb-4">
                                <Mic className="w-12 h-12 mx-auto mb-2 text-purple-500" />
                                <p className="text-sm text-gray-600 mb-2">Voice Recording Ready</p>
                                <div className="text-lg font-mono text-gray-700">
                                  {formatTime(recordingTime)}
                                </div>
                              </div>
                              
                              <div className="flex justify-center gap-4">
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={saveRecording}
                                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                                >
                                  <Play className="w-5 h-5" />
                                  Save Recording
                                </motion.button>
                                
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={discardRecording}
                                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  Discard
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // File Upload Interface
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-4">
                            Choose {selectedAttachmentType === 'image' ? 'image' : 'document'} from device
                          </p>
                          
                          <div className="space-y-3">
                            {/* File Picker Button */}
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = selectedAttachmentType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
                                input.multiple = false;
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    // Upload the file to the server
                                    const formData = new FormData();
                                    formData.append('attachments', file);
                                    
                                    try {
                                      const response = await csrfFetch('/api/upload-attachments', {
                                        method: 'POST',
                                        headers: {
                                          'x-user-id': teacherId,
                                        },
                                        body: formData,
                                      });
                                      
                                      if (response.ok) {
                                        const result = await response.json();
                                        if (result.success && result.attachments && result.attachments.length > 0) {
                                          const attachment = result.attachments[0];
                                          handleFileUploadSuccess(attachment);
                                        } else {
                                          throw new Error('Upload failed');
                                        }
                                      } else {
                                        const error = await response.json();
                                        throw new Error(error.error || 'Upload failed');
                                      }
                                    } catch (error) {
                                      console.error('Error uploading file:', error);
                                      alert('Error uploading file. Please try again.');
                                    }
                                  }
                                };
                                input.click();
                              }}
                              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
                            >
                              <Upload className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {selectedAttachmentType === 'image' ? 'Choose from Gallery' : 'Choose Document'}
                              </span>
                            </motion.button>
                            
                            {/* ImageKit Upload as Alternative */}
                            <div className="text-xs text-gray-500">or</div>
                            
                            <ImageKitUpload
                              onSuccess={handleFileUploadSuccess}
                              onError={(error) => console.error('Upload error:', error)}
                            />
                          </div>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAttachmentType(null);
                          setIsRecording(false);
                          setRecordedAudio(null);
                        }}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                  
                  {/* Attached Files */}
                  {formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files:</h4>
                      {formData.attachments.map((attachment, index) => {
                        const getFileIcon = (fileType: string) => {
                          if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
                          if (fileType.startsWith('audio/')) return <Mic className="w-4 h-4 text-purple-500" />;
                          return <FileText className="w-4 h-4 text-green-500" />;
                        };

                        const getFileTypeColor = (fileType: string) => {
                          if (fileType.startsWith('image/')) return 'bg-blue-50 border-blue-200';
                          if (fileType.startsWith('audio/')) return 'bg-purple-50 border-purple-200';
                          return 'bg-green-50 border-green-200';
                        };

                        return (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${getFileTypeColor(attachment.fileType)}`}>
                            <div className="flex items-center">
                              {getFileIcon(attachment.fileType)}
                              <span className="text-sm text-gray-700 ml-2">{attachment.fileName}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({(attachment.fileSize / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Homework'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {(!selectedClass || !selectedSubject) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center"
            >
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Class and Subject</h3>
              <p className="text-gray-500">Please select a class and subject to create homework</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModernHomeworkCreation;
