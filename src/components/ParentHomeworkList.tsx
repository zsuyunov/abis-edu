/*
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isPast } from 'date-fns';
import { Homework, HomeworkAttachment, HomeworkSubmission, SubmissionAttachment } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Image, Mic, Paperclip, PlayCircle, Eye, Calendar, User, GraduationCap, Star } from 'lucide-react';

interface HomeworkWithDetails extends Homework {
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  attachments: HomeworkAttachment[];
  submissions: (HomeworkSubmission & { attachments: SubmissionAttachment[] })[];
}

interface ParentHomeworkListProps {
  homeworks: HomeworkWithDetails[];
  childName: string;
}

const ParentHomeworkList: React.FC<ParentHomeworkListProps> = ({ homeworks, childName }) => {
  const [selectedHomework, setSelectedHomework] = useState<HomeworkWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const getStatusBadge = (homework: HomeworkWithDetails) => {
    const submission = homework.submissions[0];
    if (submission) {
      if (submission.status === 'GRADED') {
        const grade = submission.grade;
        const passingGrade = homework.passingGrade || 50;
        const isPassing = grade !== null && grade >= passingGrade;
        return (
          <Badge className={isPassing ? "bg-green-500" : "bg-red-500"}>
            Graded ({grade !== null ? grade.toFixed(1) : 'N/A'})
          </Badge>
        );
      }
      if (submission.status === 'SUBMITTED') return <Badge className="bg-blue-500">Submitted</Badge>;
      if (submission.status === 'LATE') return <Badge className="bg-yellow-500">Submitted Late</Badge>;
    }
    if (isPast(homework.dueDate)) return <Badge variant="destructive">Missed</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const handleViewClick = (homework: HomeworkWithDetails) => {
    setSelectedHomework(homework);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedHomework(null);
  };

  const renderAttachmentIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE': return <Image className="h-4 w-4 mr-1" />;
      case 'DOCUMENT': return <FileText className="h-4 w-4 mr-1" />;
      case 'AUDIO': return <Mic className="h-4 w-4 mr-1" />;
      case 'VIDEO': return <PlayCircle className="h-4 w-4 mr-1" />;
      default: return <Paperclip className="h-4 w-4 mr-1" />;
    }
  };

  const getGradeColor = (grade: number | null, passingGrade: number | null) => {
    if (grade === null || passingGrade === null) return 'text-gray-500';
    if (grade >= 90) return 'text-green-600';
    if (grade >= passingGrade) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{childName}'s Homework Assignments</h2>
      {homeworks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No homework assignments found for the selected criteria.</p>
          </CardContent>
        </Card>
      ) : (
        homeworks.map((homework) => (
          <Card key={homework.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{homework.title}</CardTitle>
              {getStatusBadge(homework)}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm"><strong>Subject:</strong> {homework.subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-500" />
                    <span className="text-sm"><strong>Teacher:</strong> {homework.teacher.firstName} {homework.teacher.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-sm"><strong>Assigned:</strong> {format(new Date(homework.assignedDate), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-500" />
                    <span className="text-sm"><strong>Due:</strong> {format(new Date(homework.dueDate), 'PPP')}</span>
                  </div>
                </div>

                {homework.submissions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Submission Details:</h4>
                    <div className="p-3 border rounded-md bg-gray-50">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <strong>Status:</strong> 
                          <Badge variant={homework.submissions[0].isLate ? "secondary" : "default"} className="ml-2">
                            {homework.submissions[0].status}
                          </Badge>
                        </p>
                        {homework.submissions[0].submissionDate && (
                          <p className="text-sm">
                            <strong>Submitted On:</strong> {format(new Date(homework.submissions[0].submissionDate), 'PPP')}
                          </p>
                        )}
                        {homework.submissions[0].grade !== null && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className={`text-sm font-bold ${getGradeColor(homework.submissions[0].grade, homework.passingGrade)}`}>
                              Grade: {homework.submissions[0].grade.toFixed(1)}/100
                            </span>
                            {homework.passingGrade && (
                              <span className="text-xs text-gray-500">
                                (Pass: {homework.passingGrade}/100)
                              </span>
                            )}
                          </div>
                        )}
                        {homework.submissions[0].feedback && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs font-semibold text-blue-700">Teacher's Feedback:</p>
                            <p className="text-sm text-blue-800">{homework.submissions[0].feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {homework.description && (
                <div className="mt-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{homework.description}</p>
                </div>
              )}

              {homework.attachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-sm mb-1">Assignment Attachments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {homework.attachments.slice(0, 3).map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline text-xs bg-blue-50 px-2 py-1 rounded-md"
                      >
                        {renderAttachmentIcon(attachment.fileType)}
                        {attachment.originalName}
                      </a>
                    ))}
                    {homework.attachments.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{homework.attachments.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleViewClick(homework)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Detailed View Modal }
      {selectedHomework && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedHomework.title} - Full Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Assignment Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Subject:</strong> {selectedHomework.subject.name}</p>
                    <p><strong>Teacher:</strong> {selectedHomework.teacher.firstName} {selectedHomework.teacher.lastName}</p>
                    <p><strong>Assigned Date:</strong> {format(new Date(selectedHomework.assignedDate), 'PPP')}</p>
                    <p><strong>Due Date:</strong> {format(new Date(selectedHomework.dueDate), 'PPP')}</p>
                    {selectedHomework.totalPoints && (
                      <p><strong>Total Points:</strong> {selectedHomework.totalPoints}</p>
                    )}
                    {selectedHomework.passingGrade && (
                      <p><strong>Passing Grade:</strong> {selectedHomework.passingGrade}/100</p>
                    )}
                  </div>
                </div>

                {selectedHomework.submissions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">{childName}'s Submission</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Status:</strong> 
                        <Badge className="ml-2" variant={selectedHomework.submissions[0].isLate ? "secondary" : "default"}>
                          {selectedHomework.submissions[0].status}
                        </Badge>
                      </p>
                      {selectedHomework.submissions[0].submissionDate && (
                        <p><strong>Submitted:</strong> {format(new Date(selectedHomework.submissions[0].submissionDate), 'PPP')}</p>
                      )}
                      {selectedHomework.submissions[0].isLate && (
                        <p className="text-yellow-600"><strong>Note:</strong> Submitted after deadline</p>
                      )}
                      {selectedHomework.submissions[0].grade !== null && (
                        <p className={getGradeColor(selectedHomework.submissions[0].grade, selectedHomework.passingGrade)}>
                          <strong>Grade:</strong> {selectedHomework.submissions[0].grade.toFixed(1)}/100
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedHomework.description && (
                <div>
                  <h3 className="font-semibold mb-2">Assignment Description</h3>
                  <p className="text-sm text-gray-700 p-3 bg-gray-50 border rounded-md">
                    {selectedHomework.description}
                  </p>
                </div>
              )}

              {selectedHomework.instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <p className="text-sm text-gray-700 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    {selectedHomework.instructions}
                  </p>
                </div>
              )}

              {selectedHomework.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Assignment Attachments</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedHomework.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline text-sm bg-blue-50 px-3 py-2 rounded-md"
                      >
                        {renderAttachmentIcon(attachment.fileType)}
                        {attachment.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedHomework.submissions.length > 0 && (
                <>
                  {selectedHomework.submissions[0].content && (
                    <div>
                      <h3 className="font-semibold mb-2">{childName}'s Text Submission</h3>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        <p className="text-sm text-gray-700">{selectedHomework.submissions[0].content}</p>
                      </div>
                    </div>
                  )}

                  {selectedHomework.submissions[0].attachments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">{childName}'s Submitted Files</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedHomework.submissions[0].attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-green-600 hover:underline text-sm bg-green-50 px-3 py-2 rounded-md"
                          >
                            {renderAttachmentIcon(attachment.fileType)}
                            {attachment.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedHomework.submissions[0].feedback && (
                    <div>
                      <h3 className="font-semibold mb-2">Teacher's Feedback</h3>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">{selectedHomework.submissions[0].feedback}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={handleViewModalClose}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ParentHomeworkList;

*/