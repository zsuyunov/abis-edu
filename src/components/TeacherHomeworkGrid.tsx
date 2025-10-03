"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, ChevronDown, FileText, Clock, CheckCircle, Plus, GraduationCap, Trash2, Mic, Image, Play, Pause, Download, Eye, X, ArrowLeft } from 'lucide-react';
import ModernHomeworkCreation from './ModernHomeworkCreation';

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

interface Homework {
  id: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  dueTime: string;
  className: string;
  subjectName: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    originalName: string;
    fileSize: number;
  }>;
  createdAt: string;
  status: 'active' | 'completed' | 'overdue';
}

interface TeacherHomeworkGridProps {
  teacherId: string;
  teacherData: TeacherData;
  onHomeworkCreated: () => void;
  onCancel: () => void;
}

const TeacherHomeworkGrid: React.FC<TeacherHomeworkGridProps> = ({
  teacherId,
  teacherData,
  onHomeworkCreated,
  onCancel,
}) => {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingHomework, setDeletingHomework] = useState<string | null>(null);
  const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: boolean }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  // Debug audio players state changes
  useEffect(() => {
  }, [audioPlayers]);

  // Fetch homework data
  const fetchHomework = async () => {
    if (!selectedClass || !selectedSubject) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teacher-homework?classId=${selectedClass}&subjectId=${selectedSubject}`, {
        headers: {
          'x-user-id': teacherId,
        },
      });
      
      
      if (response.ok) {
        const data = await response.json();
        setHomeworkList(data.homework || []);
      } else {
        console.error('❌ API Error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Error fetching homework:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [selectedClass, selectedSubject, teacherId]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      // Pause all audio elements and clear refs
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // Show creation form when view mode is 'create' and both class and subject are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && viewMode === 'create') {
      setShowCreationForm(true);
    } else {
      setShowCreationForm(false);
    }
  }, [selectedClass, selectedSubject, viewMode]);

  const handleHomeworkCreated = () => {
    setShowCreationForm(false);
    setViewMode('list'); // Switch back to list view
    fetchHomework(); // Refresh homework list
    onHomeworkCreated();
  };

  const handleBackToSelection = () => {
    setSelectedClass('');
    setSelectedSubject('');
    setShowCreationForm(false);
    // Keep viewMode as 'create' to show class/subject selection
  };

  const handleCancel = () => {
    setShowCreationForm(false);
    setSelectedClass('');
    setSelectedSubject('');
    onCancel();
  };

  const handleAudioPlay = (fileUrl: string) => {
    console.log('🎵 Audio play clicked:', fileUrl);
    console.log('🎵 Current audio players:', audioPlayers);
    
    // Toggle the audio player visibility
    setAudioPlayers(prev => ({
      ...prev,
      [fileUrl]: !prev[fileUrl]
    }));
  };

  const handleImagePreview = (fileUrl: string) => {
    setPreviewImage(fileUrl);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDocument = (fileUrl: string) => {
    // For documents, open in new tab for viewing (not downloading)
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    try {
      setDeletingHomework(homeworkId);
      
      const response = await fetch(`/api/teacher-homework?homeworkId=${homeworkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete homework');
      }

      // Remove the homework from the local state
      setHomeworkList(prev => prev.filter(hw => hw.id !== homeworkId));
      
      alert('Homework deleted successfully!');
    } catch (error) {
      console.error('Error deleting homework:', error);
      alert(`Failed to delete homework: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingHomework(null);
    }
  };

  const confirmDeleteHomework = (homeworkId: string, homeworkTitle: string) => {
    if (confirm(`Are you sure you want to delete "${homeworkTitle}"?\n\nThis action cannot be undone and will permanently remove:\n• All student submissions\n• All attachments\n• All grades and feedback\n\nClick OK to confirm deletion.`)) {
      handleDeleteHomework(homeworkId);
    }
  };

  const handleGradeHomework = (homework: Homework) => {
    router.push(`/teacher/homework/grade/${homework.id}`);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return <Image className="w-4 h-4" />;
      case 'AUDIO':
        return <Mic className="w-4 h-4" />;
      case 'DOCUMENT':
      case 'TEXT':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFileColor = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return 'bg-green-100 text-green-600';
      case 'AUDIO':
        return 'bg-purple-100 text-purple-600';
      case 'DOCUMENT':
      case 'TEXT':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const selectedClassData = teacherData.assignedClasses.find(c => c.id === selectedClass);
  const selectedSubjectData = teacherData.assignedSubjects.find(s => s.id === selectedSubject);

  if (showCreationForm) {
    return (
      <ModernHomeworkCreation
        teacherId={teacherId}
        teacherData={teacherData}
        onHomeworkCreated={handleHomeworkCreated}
        onCancel={handleBackToSelection}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Homework Management</h2>
              <p className="text-blue-100">
                {viewMode === 'list' ? 'View and manage homework assignments' : 'Create new homework assignment'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (selectedClass && selectedSubject) {
                    // If class and subject are already selected, go directly to creation form
                    setViewMode('create');
                  } else {
                    // If no selections, reset and show class/subject selection
                    setSelectedClass('');
                    setSelectedSubject('');
                    setViewMode('create');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold border-2 border-white/20"
              >
                Create New
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Class and Subject Selection - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Class and Subject</h3>
              <p className="text-gray-600">
                {(!selectedClass || !selectedSubject) 
                  ? 'Please select a class and subject to view or create homework'
                  : `Currently viewing: ${selectedClassData?.name || 'Unknown Class'} • ${selectedSubjectData?.name || 'Unknown Subject'}`
                }
              </p>
            </div>
            {viewMode === 'create' && (selectedClass && selectedSubject) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </motion.button>
            )}
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Class Selection */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-gray-600 mr-2" />
                <label className="text-sm font-medium text-gray-700">Class</label>
                {selectedClass && (
                  <div className="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                >
                  <span className={selectedClass ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedClassData ? selectedClassData.name : 'Select Class'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
                
                <AnimatePresence>
                  {showClassDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      {teacherData.assignedClasses.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setSelectedClass(cls.id);
                            setShowClassDropdown(false);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{cls.name}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Subject Selection */}
            <div className="relative">
              <div className="flex items-center mb-3">
                <BookOpen className="w-5 h-5 text-gray-600 mr-2" />
                <label className="text-sm font-medium text-gray-700">Subject</label>
                {selectedSubject && (
                  <div className="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                >
                  <span className={selectedSubject ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedSubjectData ? selectedSubjectData.name : 'Select Subject'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
                
                <AnimatePresence>
                  {showSubjectDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      {teacherData.assignedSubjects.map((subject) => (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubject(subject.id);
                            setShowSubjectDropdown(false);
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{subject.name}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>



        {/* Homework List */}
        {selectedClass && selectedSubject && viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Homework Assignments</h3>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-4">📚</div>
                <div className="text-gray-600">Loading homework...</div>
              </div>
            ) : homeworkList.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No homework yet</h3>
                <p className="text-gray-500">Create your first homework assignment</p>
              </div>
            ) : (
              <div className="space-y-6">
                {homeworkList.map((homework, index) => (
                  <motion.div
                    key={homework.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{homework.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            homework.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : homework.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <CheckCircle className="w-4 h-4" />
                            {homework.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {homework.subjectName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {homework.className}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{homework.description}</p>
                      </div>
                    </div>

                    {/* Dates and Time Remaining */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Assigned: {new Date(homework.assignedDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(homework.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-blue-700 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>7 days 8h left</span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Due: {new Date(homework.dueDate).toLocaleDateString()} at {homework.dueTime}
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">2</div>
                        <div className="text-xs text-blue-700 font-medium">Total Students</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <div className="text-xs text-green-700 font-medium">Submitted</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <div className="text-2xl font-bold text-red-600">0</div>
                        <div className="text-xs text-red-700 font-medium">Late</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600">0</div>
                        <div className="text-xs text-purple-700 font-medium">Graded</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <div className="text-2xl font-bold text-orange-600">0%</div>
                        <div className="text-xs text-orange-700 font-medium">Submission Rate</div>
                      </div>
                    </div>

                    {/* Attachments */}
                    {homework.attachments && homework.attachments.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">
                            Attachments ({homework.attachments.length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {homework.attachments.map((attachment, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.02 }}
                              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(attachment.fileType)}`}>
                                  {getFileIcon(attachment.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.originalName}
                                  </div>
                                  <div className="text-xs text-gray-500 mb-2">
                                    {attachment.fileType} • {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : `Debug: fileSize=${attachment.fileSize}`}
                                  </div>
                                  
                                   {/* Action Buttons */}
                                   <div className="flex items-center gap-2">
                                     {/* View Button for Images and Documents */}
                                     {attachment.fileType !== 'AUDIO' && (
                                       <motion.button
                                         whileHover={{ scale: 1.1 }}
                                         whileTap={{ scale: 0.9 }}
                                         onClick={() => {
                                           if (attachment.fileType === 'IMAGE') {
                                             handleImagePreview(attachment.fileUrl);
                                           } else {
                                             // For documents and other files, open in new tab for viewing
                                             handleViewDocument(attachment.fileUrl);
                                           }
                                         }}
                                         className={`p-1.5 rounded-lg transition-colors ${
                                           attachment.fileType === 'IMAGE' 
                                             ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                             : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                         }`}
                                         title={attachment.fileType === 'IMAGE' ? "Preview Image" : "View File"}
                                       >
                                         <Eye className="w-3 h-3" />
                                       </motion.button>
                                     )}
                                     
                                     {/* Play Button for Audio */}
                                     {attachment.fileType === 'AUDIO' && (
                                       <motion.button
                                         whileHover={{ scale: 1.1 }}
                                         whileTap={{ scale: 0.9 }}
                                         onClick={() => handleAudioPlay(attachment.fileUrl)}
                                         className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                         title={audioPlayers[attachment.fileUrl] ? "Hide Player" : "Show Player"}
                                       >
                                         {audioPlayers[attachment.fileUrl] ? (
                                           <Pause className="w-3 h-3" />
                                         ) : (
                                           <Play className="w-3 h-3" />
                                         )}
                                       </motion.button>
                                     )}
                                     
                                     {/* Download Button for All Files */}
                                     <motion.button
                                       whileHover={{ scale: 1.1 }}
                                       whileTap={{ scale: 0.9 }}
                                       onClick={() => handleDownload(attachment.fileUrl, attachment.originalName)}
                                       className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                       title="Download File"
                                     >
                                       <Download className="w-3 h-3" />
                                     </motion.button>
                                   </div>
                                </div>
                              </div>
                              
                              {/* Audio Player */}
                              {attachment.fileType === 'AUDIO' && audioPlayers[attachment.fileUrl] && (
                                <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                                        <Mic className="w-4 h-4 text-purple-600" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {attachment.originalName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          AUDIO • {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                          setAudioPlayers(prev => ({
                                            ...prev,
                                            [attachment.fileUrl]: false
                                          }));
                                        }}
                                        className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                        title="Hide Player"
                                      >
                                        <Pause className="w-3 h-3" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDownload(attachment.fileUrl, attachment.originalName)}
                                        className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                        title="Download Audio"
                                      >
                                        <Download className="w-3 h-3" />
                                      </motion.button>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs text-gray-600 font-medium">
                                        Audio Player: {attachment.originalName}
                                      </div>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                          setAudioPlayers(prev => ({
                                            ...prev,
                                            [attachment.fileUrl]: false
                                          }));
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Close Player"
                                      >
                                        <X className="w-3 h-3" />
                                      </motion.button>
                                    </div>
                                    
                                    <audio
                                      ref={(el) => {
                                        if (el) {
                                          audioRefs.current[attachment.fileUrl] = el;
                                        }
                                      }}
                                      controls
                                      preload="metadata"
                                      className="w-full h-8"
                                      onLoadStart={() => console.log('🎵 Audio load started:', attachment.fileUrl)}
                                      onLoadedMetadata={() => console.log('🎵 Audio metadata loaded:', attachment.fileUrl)}
                                      onCanPlay={() => console.log('🎵 Audio can play:', attachment.fileUrl)}
                                      onPlay={() => console.log('🎵 Audio playing:', attachment.fileUrl)}
                                      onError={(e) => {
                                        console.error('🎵 Audio error:', e);
                                        console.error('🎵 Audio src:', attachment.fileUrl);
                                        console.error('🎵 Audio element:', e.currentTarget);
                                      }}
                                    >
                                      <source src={attachment.fileUrl} type="audio/webm" />
                                      <source src={attachment.fileUrl} type="audio/mp3" />
                                      <source src={attachment.fileUrl} type="audio/wav" />
                                      <source src={attachment.fileUrl} type="audio/mpeg" />
                                      <source src={attachment.fileUrl} type="audio/ogg" />
                                      <source src={attachment.fileUrl} type="audio/m4a" />
                                      <source src={attachment.fileUrl} type="audio/aac" />
                                      <source src={attachment.fileUrl} type="audio/mp4" />
                                      <source src={attachment.fileUrl} type="audio/3gp" />
                                      <source src={attachment.fileUrl} type="audio/amr" />
                                      Your browser does not support the audio element.
                                    </audio>
                                    
                                    <div className="mt-2 text-xs text-gray-500">
                                      Click play on the audio controls to start playback.
                                    </div>
                                    <div className="mt-1">
                                      <a 
                                        href={attachment.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 hover:text-blue-700 underline"
                                      >
                                        Direct Link to Audio File
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-pink-600">★</span>
                        </div>
                        <span className="font-medium">87 points</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleGradeHomework(homework)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                          title="Grade Homework"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => confirmDeleteHomework(homework.id, homework.title)}
                          disabled={deletingHomework === homework.id}
                          className={`p-2 rounded-lg transition-colors ${
                            deletingHomework === homework.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title="Delete Homework"
                        >
                          {deletingHomework === homework.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State - No Selection */}
        {(!selectedClass || !selectedSubject) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center"
          >
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Class and Subject</h3>
            <p className="text-gray-500">Please select a class and subject to view or create homework</p>
          </motion.div>
        )}

        {/* Empty State - No Homework */}
        {selectedClass && selectedSubject && viewMode === 'list' && homeworkList.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center"
          >
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Homework Yet</h3>
            <p className="text-gray-500 mb-4">No homework assignments found for this class and subject</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create First Homework
            </motion.button>
          </motion.div>
        )}

        {/* Image Preview Modal */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setPreviewImage(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Image Preview</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPreviewImage(null)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="p-4">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(previewImage, 'image-preview')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPreviewImage(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherHomeworkGrid;
