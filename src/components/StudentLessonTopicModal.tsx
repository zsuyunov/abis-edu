"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, 
  Clock, 
  MapPin, 
  BookOpen, 
  User, 
  FileText, 
  Image, 
  Link,
  Download,
  Eye
} from "lucide-react";

interface TimetableSlot {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  status: string;
  subject: { name: string; id: number };
  teacher: { firstName: string; lastName: string; id: string };
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

interface StudentLessonTopicModalProps {
  slot: TimetableSlot;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const StudentLessonTopicModal = ({ slot, isOpen, setIsOpen }: StudentLessonTopicModalProps) => {
  const [selectedTopic, setSelectedTopic] = useState<TimetableSlotTopic | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "✅";
      case "IN_PROGRESS":
        return "🔄";
      case "DRAFT":
        return "📝";
      default:
        return "📝";
    }
  };

  const handleAttachmentDownload = (attachment: string) => {
    // This would typically download the actual file
    console.log("Downloading attachment:", attachment);
  };

  const getAttachmentIcon = (attachment: string) => {
    const extension = attachment.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-4 h-4" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-2xl lg:max-w-3xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-lg">Lesson Details</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {slot.subject.name} - {new Date(slot.slotDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1">
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {/* Lesson Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className="text-xs sm:text-sm">
                {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className="text-xs sm:text-sm">{slot.roomNumber} {slot.buildingName && `(${slot.buildingName})`}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className="text-xs sm:text-sm">{slot.subject.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className="text-xs sm:text-sm">{slot.teacher.firstName} {slot.teacher.lastName}</span>
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-semibold">Lesson Topics</h3>
            
            {slot.topics.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {slot.topics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-2 sm:p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                            <span className="text-sm sm:text-base">{getStatusIcon(topic.status)}</span>
                            <h4 className="font-medium text-sm sm:text-base">{topic.topicTitle}</h4>
                            <Badge className={`${getStatusColor(topic.status)} text-xs`}>
                              {topic.status}
                            </Badge>
                          </div>
                          {topic.topicDescription && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">{topic.topicDescription}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-gray-600">Progress</span>
                          <span className="text-xs sm:text-sm font-medium">{topic.progressPercentage}%</span>
                        </div>
                        <Progress value={topic.progressPercentage} className="w-full h-1 sm:h-2" />
                      </div>
                      
                      {/* Attachments */}
                      {topic.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Attachments:</p>
                          <div className="flex flex-wrap gap-1">
                            {topic.attachments.map((attachment, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs p-1 h-auto"
                                onClick={() => handleAttachmentDownload(attachment)}
                              >
                                {getAttachmentIcon(attachment)}
                                <span className="ml-1 hidden sm:inline">{attachment}</span>
                                <Download className="w-3 h-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 text-xs text-gray-500 gap-1">
                        <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
                        {topic.completedAt && (
                          <span>Completed: {new Date(topic.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">No Topics Available</h3>
                <p className="text-xs sm:text-sm text-gray-600">Your teacher hasn't added any topics for this lesson yet</p>
              </div>
            )}
          </div>

          {/* Study Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-2 sm:p-3">
              <h4 className="font-medium text-blue-900 mb-1 sm:mb-2 text-xs sm:text-sm">💡 Study Tips</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• Review the lesson topics before class to prepare questions</li>
                <li>• Take notes during the lesson and compare with the provided topics</li>
                <li>• Download and review any attachments your teacher has shared</li>
                <li>• Ask questions if you need clarification on any topic</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLessonTopicModal;
