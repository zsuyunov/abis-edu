"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  FileText, 
  Image, 
  Link,
  CheckCircle,
  AlertCircle,
  Upload
} from "lucide-react";
import { toast } from "sonner";

interface TimetableSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  isSupervisor: boolean;
  subject: { name: string; id: number };
  class: { name: string; id: number };
  branch: { shortName: string };
  topics: TimetableSlotTopic[];
}

interface TimetableSlotTopic {
  id: number;
  topicTitle: string;
  topicDescription?: string;
  attachments: string[];
  status: string;
  progressPercentage: number;
  completedAt?: string;
  createdAt: string;
}

interface TimetableSlotModalProps {
  slot: TimetableSlot;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onUpdate: () => void;
}

const TimetableSlotModal = ({ slot, isOpen, setIsOpen, onUpdate }: TimetableSlotModalProps) => {
  const [topics, setTopics] = useState<TimetableSlotTopic[]>(slot.topics || []);
  const [editingTopic, setEditingTopic] = useState<TimetableSlotTopic | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicForm, setTopicForm] = useState({
    topicTitle: "",
    topicDescription: "",
    attachments: [] as string[],
    status: "DRAFT",
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTopics(slot.topics || []);
  }, [slot]);

  const handleAddTopic = () => {
    setEditingTopic(null);
    setTopicForm({
      topicTitle: "",
      topicDescription: "",
      attachments: [],
      status: "DRAFT",
      progressPercentage: 0,
    });
    setShowTopicForm(true);
  };

  const handleEditTopic = (topic: TimetableSlotTopic) => {
    setEditingTopic(topic);
    setTopicForm({
      topicTitle: topic.topicTitle,
      topicDescription: topic.topicDescription || "",
      attachments: topic.attachments,
      status: topic.status,
      progressPercentage: topic.progressPercentage,
    });
    setShowTopicForm(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.topicTitle.trim()) {
      toast.error("Topic title is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingTopic 
        ? `/api/timetable-slot-topics/${editingTopic.id}`
        : "/api/timetable-slot-topics";
      
      const method = editingTopic ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          ...topicForm,
          slotId: slot.id,
          subjectId: slot.subject.id,
          classId: slot.class.id,
          branchId: 1, // This should be passed from parent or use a different approach
          academicYearId: 1, // This should be passed from parent
        }),
      });

      if (response.ok) {
        toast.success(editingTopic ? "Topic updated successfully" : "Topic created successfully");
        setShowTopicForm(false);
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save topic");
      }
    } catch (error) {
      console.error("Failed to save topic:", error);
      toast.error("Failed to save topic");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    
    try {
      const response = await fetch(`/api/timetable-slot-topics/${topicId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        toast.success("Topic deleted successfully");
        onUpdate();
      } else {
        toast.error("Failed to delete topic");
      }
    } catch (error) {
      console.error("Failed to delete topic:", error);
      toast.error("Failed to delete topic");
    }
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => file.name);
      setTopicForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setTopicForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOverallProgress = () => {
    if (topics.length === 0) return 0;
    const totalProgress = topics.reduce((sum, topic) => sum + topic.progressPercentage, 0);
    return Math.round(totalProgress / topics.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Lesson Details</CardTitle>
              <CardDescription>
                {slot.subject.name} - {slot.class.name} • {new Date(slot.slotDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Lesson Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{slot.roomNumber} {slot.buildingName && `(${slot.buildingName})`}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{slot.subject.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{slot.class.name}</span>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{getOverallProgress()}%</span>
            </div>
            <Progress value={getOverallProgress()} className="w-full" />
          </div>

          <Tabs defaultValue="topics" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="topics">Classwork Topics</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="topics" className="space-y-4">
              {/* Topics List */}
              <div className="space-y-4">
                {topics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{topic.topicTitle}</h3>
                          {topic.topicDescription && (
                            <p className="text-sm text-gray-600 mt-1">{topic.topicDescription}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(topic.status)}>
                            {topic.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTopic(topic)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTopic(topic.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{topic.progressPercentage}%</span>
                        </div>
                        <Progress value={topic.progressPercentage} className="w-full" />
                      </div>
                      
                      {topic.attachments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {topic.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {attachment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
                        {topic.completedAt && (
                          <span>Completed: {new Date(topic.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Topic Button */}
              <Button onClick={handleAddTopic} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Classwork Topic
              </Button>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Topics</p>
                        <p className="text-2xl font-bold text-gray-900">{topics.length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {topics.filter(t => t.status === "COMPLETED").length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {topics.filter(t => t.status === "IN_PROGRESS").length}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Topic Form Modal */}
          {showTopicForm && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle>{editingTopic ? "Edit Topic" : "Add New Topic"}</CardTitle>
                <CardDescription>
                  {editingTopic ? "Update the topic details" : "Create a new classwork topic for this lesson"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topicTitle">Topic Title *</Label>
                  <Input
                    id="topicTitle"
                    value={topicForm.topicTitle}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, topicTitle: e.target.value }))}
                    placeholder="e.g., Introduction to Algebra"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="topicDescription">Description</Label>
                  <Textarea
                    id="topicDescription"
                    value={topicForm.topicDescription}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, topicDescription: e.target.value }))}
                    placeholder="Describe what will be covered in this topic..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={topicForm.status}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="progressPercentage">Progress Percentage</Label>
                  <Input
                    id="progressPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={topicForm.progressPercentage}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, progressPercentage: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="attachments">Attachments</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      onChange={handleAttachmentUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="attachments"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </label>
                  </div>
                  
                  {topicForm.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {topicForm.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{attachment}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowTopicForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTopic} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Topic"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableSlotModal;
