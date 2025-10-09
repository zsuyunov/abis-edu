"use client";

import { useState, useEffect, useRef } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import Image from "next/image";
import { toast } from "react-toastify";
import { Upload, FileText, X, Download, Eye, Calendar, Clock, User, BookOpen } from "lucide-react";

interface TimetableTopicModalProps {
  timetable: any;
  onClose: () => void;
  onSuccess: () => void;
}

const TimetableTopicModal = ({ timetable, onClose, onSuccess }: TimetableTopicModalProps) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "DRAFT",
    progressPercentage: 0,
    attachments: [] as string[],
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);

  useEffect(() => {
    fetchTopics();
  }, [timetable.id]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await csrfFetch(`/api/timetable-topics?timetableId=${timetable.id}`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await csrfFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    return uploadedUrls;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      
      // Upload files first if any
      let uploadedAttachments: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        uploadedAttachments = await uploadFiles(selectedFiles);
      }

      const payload = {
        ...formData,
        attachments: [...formData.attachments, ...uploadedAttachments],
        timetableId: timetable.id,
        teacherId: timetable.teacherId,
        subjectId: timetable.subjectId,
        classId: timetable.classId,
        branchId: timetable.branchId,
        academicYearId: timetable.academicYearId,
      };

      const response = await csrfFetch("/api/timetable-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Topic created successfully!");
        setFormData({
          title: "",
          description: "",
          status: "DRAFT",
          progressPercentage: 0,
          attachments: [],
        });
        setSelectedFiles([]);
        setShowCreateForm(false);
        fetchTopics();
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create topic");
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Failed to create topic");
    } finally {
      setIsCreating(false);
      setUploadingFiles(false);
    }
  };

  const handleUpdate = async (topicId: number, updates: any) => {
    try {
      const response = await csrfFetch(`/api/timetable-topics/${topicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success("Topic updated successfully!");
        fetchTopics();
        setIsEditing(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update topic");
      }
    } catch (error) {
      console.error("Error updating topic:", error);
      toast.error("Failed to update topic");
    }
  };

  const handleDelete = async (topicId: number) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;

    try {
      const response = await csrfFetch(`/api/timetable-topics/${topicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Topic deleted successfully!");
        fetchTopics();
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete topic");
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("Failed to delete topic");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Lesson Topics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {timetable.subject.name} • {timetable.class.name} • {timetable.roomNumber}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(timetable.fullDate)} • {new Date(timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - {new Date(timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Image src="/close.png" alt="Close" width={24} height={24} />
          </button>
        </div>

        {/* CREATE TOPIC BUTTON */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-lamaSky text-white rounded-md hover:bg-blue-600"
          >
            <Image src="/create.png" alt="Add" width={16} height={16} />
            Add New Topic
          </button>
        )}

        {/* CREATE FORM */}
        {showCreateForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4" />
                    Topic Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter lesson topic..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="DRAFT">📝 Draft</option>
                    <option value="IN_PROGRESS">🔄 In Progress</option>
                    <option value="COMPLETED">✅ Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress: {formData.progressPercentage}%
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progressPercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, progressPercentage: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${formData.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Detailed description of the lesson content, objectives, and activities..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4" />
                    Attachments
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload files</span>
                    </button>
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md border">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isCreating || uploadingFiles}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isCreating || uploadingFiles ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {uploadingFiles ? "Uploading..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Create Topic
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    title: "",
                    description: "",
                    status: "DRAFT",
                    progressPercentage: 0,
                    attachments: [],
                  });
                  setSelectedFiles([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* TOPICS LIST */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image
              src="/nodata.png"
              alt="No topics"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <p>No topics added for this lesson yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {topics.map((topic: any) => (
              <div key={topic.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(topic.status)}`}>
                        {topic.status === 'DRAFT' && '📝 Draft'}
                        {topic.status === 'IN_PROGRESS' && '🔄 In Progress'}
                        {topic.status === 'COMPLETED' && '✅ Completed'}
                        {topic.status === 'CANCELLED' && '❌ Cancelled'}
                      </span>
                    </div>
                    
                    {topic.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{topic.description}</p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {topic.progressPercentage > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm text-gray-600">{topic.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${topic.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {topic.attachments && topic.attachments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Attachments ({topic.attachments.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {topic.attachments.map((attachment: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate flex-1">
                                {attachment.split('/').pop() || 'Attachment'}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => window.open(attachment, '_blank')}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="View"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = attachment;
                                    link.download = attachment.split('/').pop() || 'attachment';
                                    link.click();
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created: {formatDate(topic.createdAt)}</span>
                      </div>
                      {topic.completedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Completed: {formatDate(topic.completedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>By: {topic.teacher.firstName} {topic.teacher.lastName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Expand/Collapse"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditing(topic.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Edit"
                    >
                      <Image src="/update.png" alt="Edit" width={16} height={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Image src="/delete.png" alt="Delete" width={16} height={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTopic === topic.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Lesson Details</h5>
                        <div className="space-y-1 text-gray-600">
                          <p><span className="font-medium">Subject:</span> {topic.subject.name}</p>
                          <p><span className="font-medium">Class:</span> {topic.class.name}</p>
                          <p><span className="font-medium">Branch:</span> {topic.branch.shortName}</p>
                          <p><span className="font-medium">Academic Year:</span> {topic.academicYear.name}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Timetable Info</h5>
                        <div className="space-y-1 text-gray-600">
                          <p><span className="font-medium">Date:</span> {formatDate(topic.timetable.fullDate)}</p>
                          <p><span className="font-medium">Time:</span> {new Date(topic.timetable.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - {new Date(topic.timetable.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</p>
                          <p><span className="font-medium">Room:</span> {topic.timetable.roomNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableTopicModal;
