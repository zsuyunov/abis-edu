"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Save,
  FileText,
  Paperclip,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit3,
  Trash2,
  Upload,
  Eye,
  BookOpen
} from "lucide-react";
import { toast } from "react-toastify";

interface Topic {
  id?: string;
  topicTitle: string;
  topicDescription: string;
  attachments: string[];
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  progressPercentage: number;
  completedAt?: string;
  createdAt?: string;
}

interface ClassworkTopicsModalProps {
  timetableSlot: {
    id: string;
    className: string;
    subjectName: string;
    startTime: string;
    endTime: string;
    date: string;
    room: string;
  };
  existingTopics: Topic[];
  onClose: () => void;
  onSave: (topics: Topic[]) => void;
  isReadOnly?: boolean;
}

const ClassworkTopicsModal = ({
  timetableSlot,
  existingTopics,
  onClose,
  onSave,
  isReadOnly = false
}: ClassworkTopicsModalProps) => {
  const [topics, setTopics] = useState<Topic[]>(existingTopics || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTopic, setNewTopic] = useState<Topic>({
    topicTitle: "",
    topicDescription: "",
    attachments: [],
    status: "DRAFT",
    progressPercentage: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [timetableSlot.id]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/timetable-topics?timetableId=${timetableSlot.id}`);
      if (response.ok) {
        const data = await response.json();
        // Convert API topics to component format
        const convertedTopics = data.topics.map((topic: any) => ({
          id: topic.id.toString(),
          topicTitle: topic.title,
          topicDescription: topic.description || '',
          attachments: topic.attachments || [],
          status: topic.status,
          progressPercentage: topic.progressPercentage || 0,
          completedAt: topic.completedAt,
          createdAt: topic.createdAt
        }));
        setTopics(convertedTopics);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
    COMPLETED: "bg-green-100 text-green-700 border-green-300",
    CANCELLED: "bg-red-100 text-red-700 border-red-300"
  };

  const statusIcons = {
    DRAFT: <Edit3 className="w-4 h-4" />,
    IN_PROGRESS: <AlertCircle className="w-4 h-4" />,
    COMPLETED: <CheckCircle className="w-4 h-4" />,
    CANCELLED: <XCircle className="w-4 h-4" />
  };

  const handleAddTopic = () => {
    if (newTopic.topicTitle.trim()) {
      const topic: Topic = {
        ...newTopic,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setTopics([...topics, topic]);
      setNewTopic({
        topicTitle: "",
        topicDescription: "",
        attachments: [],
        status: "DRAFT",
        progressPercentage: 0
      });
      setIsEditing(false);
    }
  };

  const handleEditTopic = (topicId: string) => {
    setEditingTopicId(topicId);
  };

  const handleUpdateTopic = (topicId: string, updatedTopic: Partial<Topic>) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { 
            ...topic, 
            ...updatedTopic,
            completedAt: updatedTopic.status === "COMPLETED" ? new Date().toISOString() : topic.completedAt
          }
        : topic
    ));
    setEditingTopicId(null);
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopics(topics.filter(topic => topic.id !== topicId));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Save topics to database
      for (const topic of topics) {
        if (topic.id && topic.id.startsWith('temp-')) {
          // New topic - create via API
          const response = await fetch('/api/timetable-topics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timetableId: timetableSlot.id,
              title: topic.topicTitle,
              description: topic.topicDescription,
              status: topic.status,
              attachments: topic.attachments || [],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save topic');
          }
        } else {
          // Update existing topic via API
          const response = await fetch(`/api/timetable-topics/${topic.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: topic.topicTitle,
              description: topic.topicDescription,
              status: topic.status,
              attachments: topic.attachments || [],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update topic');
          }
        }
      }

      toast.success("Topics saved successfully!");
      fetchTopics(); // Refresh the topics list
      onClose();
    } catch (error) {
      console.error("Error saving topics:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save topics");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (topicId: string | null, files: FileList) => {
    // In a real implementation, you would upload files to a server
    // For now, we'll just add the file names to the attachments array
    const fileNames = Array.from(files).map(file => file.name);
    
    if (topicId) {
      handleUpdateTopic(topicId, {
        attachments: [...(topics.find(t => t.id === topicId)?.attachments || []), ...fileNames]
      });
    } else {
      setNewTopic(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileNames]
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Lesson Topics</h2>
                <div className="flex items-center gap-4 text-blue-100 text-sm mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(timetableSlot.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(timetableSlot.startTime)} - {formatTime(timetableSlot.endTime)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-white/10 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Subject:</span>
                <div className="font-semibold">{timetableSlot.subjectName}</div>
              </div>
              <div>
                <span className="text-blue-200">Class:</span>
                <div className="font-semibold">{timetableSlot.className}</div>
              </div>
              <div>
                <span className="text-blue-200">Room:</span>
                <div className="font-semibold">{timetableSlot.room}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Loading state */}
          {loading ? (
            <div className="space-y-4 mb-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Existing Topics */}
              <div className="space-y-4 mb-6">
                {topics.map((topic) => (
                  <div key={topic.id} className="bg-white/80 border border-gray-200 rounded-xl p-4 shadow-sm">
                    {editingTopicId === topic.id ? (
                      <EditTopicForm
                        topic={topic}
                        onSave={(updatedTopic) => handleUpdateTopic(topic.id!, updatedTopic)}
                        onCancel={() => setEditingTopicId(null)}
                        onFileUpload={(files) => handleFileUpload(topic.id!, files)}
                      />
                    ) : (
                      <TopicDisplay
                        topic={topic}
                        onEdit={() => handleEditTopic(topic.id!)}
                        onDelete={() => handleDeleteTopic(topic.id!)}
                        onFileUpload={(files) => handleFileUpload(topic.id!, files)}
                        isReadOnly={isReadOnly}
                      />
                    )}
                  </div>
                ))}
              </div>

          {/* Add New Topic */}
          {!isReadOnly && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Topic Title</label>
                    <input
                      type="text"
                      value={newTopic.topicTitle}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, topicTitle: e.target.value }))}
                      placeholder="Enter topic title..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newTopic.topicDescription}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, topicDescription: e.target.value }))}
                      placeholder="Describe what will be covered in this lesson..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddTopic}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Add Topic
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add New Topic
                </button>
              )}
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {topics.length} topic{topics.length !== 1 ? 's' : ''} • 
              {topics.filter(t => t.status === 'COMPLETED').length} completed
            </div>
            <div className="flex gap-3">
              {!isReadOnly && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Topic Display Component
const TopicDisplay = ({ 
  topic, 
  onEdit, 
  onDelete, 
  onFileUpload, 
  isReadOnly 
}: {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
  onFileUpload: (files: FileList) => void;
  isReadOnly: boolean;
}) => {
  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
    COMPLETED: "bg-green-100 text-green-700 border-green-300",
    CANCELLED: "bg-red-100 text-red-700 border-red-300"
  };

  const statusIcons = {
    DRAFT: <Edit3 className="w-4 h-4" />,
    IN_PROGRESS: <AlertCircle className="w-4 h-4" />,
    COMPLETED: <CheckCircle className="w-4 h-4" />,
    CANCELLED: <XCircle className="w-4 h-4" />
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{topic.topicTitle}</h3>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[topic.status]}`}>
              {statusIcons[topic.status]}
              {topic.status.replace('_', ' ')}
            </span>
          </div>
          {topic.topicDescription && (
            <p className="text-gray-600 text-sm mb-3">{topic.topicDescription}</p>
          )}
        </div>
        
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {topic.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topic.attachments.map((attachment, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
            >
              <Paperclip className="w-3 h-3" />
              {attachment}
            </span>
          ))}
        </div>
      )}

      {topic.status === 'IN_PROGRESS' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{topic.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${topic.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Topic Form Component
const EditTopicForm = ({ 
  topic, 
  onSave, 
  onCancel, 
  onFileUpload 
}: {
  topic: Topic;
  onSave: (updatedTopic: Partial<Topic>) => void;
  onCancel: () => void;
  onFileUpload: (files: FileList) => void;
}) => {
  const [editedTopic, setEditedTopic] = useState(topic);

  const handleSave = () => {
    onSave(editedTopic);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Topic Title</label>
        <input
          type="text"
          value={editedTopic.topicTitle}
          onChange={(e) => setEditedTopic(prev => ({ ...prev, topicTitle: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={editedTopic.topicDescription}
          onChange={(e) => setEditedTopic(prev => ({ ...prev, topicDescription: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={editedTopic.status}
            onChange={(e) => setEditedTopic(prev => ({ ...prev, status: e.target.value as Topic['status'] }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        {editedTopic.status === 'IN_PROGRESS' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editedTopic.progressPercentage}
              onChange={(e) => setEditedTopic(prev => ({ ...prev, progressPercentage: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ClassworkTopicsModal;
