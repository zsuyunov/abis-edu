/*
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
  Eye,
  TrendingUp,
  Calendar
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

interface ParentLessonTopicModalProps {
  slot: TimetableSlot;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  childName: string;
}

const ParentLessonTopicModal = ({ slot, isOpen, setIsOpen, childName }: ParentLessonTopicModalProps) => {
  const [selectedTopic, setSelectedTopic] = useState<TimetableSlotTopic | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Lesson Details</CardTitle>
              <CardDescription className="text-blue-100">
                {slot.subject.name} - {childName} • {new Date(slot.slotDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Lesson Info }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">
                  {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold">{slot.roomNumber} {slot.buildingName && `(${slot.buildingName})`}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-semibold">{slot.subject.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Teacher</p>
                <p className="font-semibold">{slot.teacher.firstName} {slot.teacher.lastName}</p>
              </div>
            </div>
          </div>

          {/* Topics List }
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Lesson Topics</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {slot.topics.length} topic{slot.topics.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            {slot.topics.length > 0 ? (
              <div className="space-y-4">
                {slot.topics.map((topic) => (
                  <Card key={topic.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{getStatusIcon(topic.status)}</span>
                            <h4 className="font-semibold text-lg text-gray-900">{topic.topicTitle}</h4>
                            <Badge className={`${getStatusColor(topic.status)} rounded-full`}>
                              {topic.status}
                            </Badge>
                          </div>
                          {topic.topicDescription && (
                            <p className="text-gray-700 mb-4 leading-relaxed">{topic.topicDescription}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar }
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-bold text-blue-600">{topic.progressPercentage}%</span>
                        </div>
                        <Progress value={topic.progressPercentage} className="w-full h-2" />
                      </div>
                      
                      {/* Attachments }
                      {topic.attachments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Attachments
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {topic.attachments.map((attachment, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-auto p-3 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                                onClick={() => handleAttachmentDownload(attachment)}
                              >
                                {getAttachmentIcon(attachment)}
                                <span className="ml-2 truncate">{attachment}</span>
                                <Download className="w-3 h-3 ml-auto" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
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
              <Card className="shadow-lg border-0 bg-gray-50">
                <CardContent className="p-12">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Topics Available</h3>
                    <p className="text-gray-600">The teacher hasn't added any topics for this lesson yet</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Parent Tips }
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Parent Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Review these topics with your child to reinforce learning at home</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Download and save any attachments for future reference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Ask your child about the topics covered to check understanding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Use the progress percentage to track learning completion</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentLessonTopicModal;

*/