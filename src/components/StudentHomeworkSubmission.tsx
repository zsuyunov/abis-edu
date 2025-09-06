"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StudentHomeworkSubmissionProps {
  studentId: string;
  selectedHomeworkId: number | null;
  onSubmissionComplete: () => void;
  onCancel: () => void;
  isMobile: boolean;
}

const StudentHomeworkSubmission = ({
  studentId,
  selectedHomeworkId,
  onSubmissionComplete,
  onCancel,
  isMobile,
}: StudentHomeworkSubmissionProps) => {
  const [loading, setLoading] = useState(false);
  const [homework, setHomework] = useState<any>(null);
  const [submissionDetails, setSubmissionDetails] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState("");

  useEffect(() => {
    if (selectedHomeworkId) {
      fetchHomeworkDetails();
    }
  }, [selectedHomeworkId]);

  const fetchHomeworkDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-homework/submit?homeworkId=${selectedHomeworkId}`);
      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework);
        setSubmissionDetails(data.submissionDetails);
        setSubmissionContent(data.submission?.content || "");
      }
    } catch (error) {
      console.error("Error fetching homework details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student-homework/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeworkId: selectedHomeworkId,
          content: submissionContent,
          attachments: [], // Will be implemented with file upload
        }),
      });

      if (response.ok) {
        onSubmissionComplete();
      } else {
        const error = await response.json();
        console.error("Submission error:", error);
      }
    } catch (error) {
      console.error("Error submitting homework:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedHomeworkId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Homework</h3>
        <p className="text-gray-600 mb-4">
          Choose a homework assignment to view details and submit your work.
        </p>
      </div>
    );
  }

  if (loading && !homework) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">📝</div>
        <div className="text-gray-600">Loading homework details...</div>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Homework Not Found</h3>
        <p className="text-gray-600 mb-4">
          The selected homework assignment could not be found.
        </p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/assignment.png" alt="Assignment" width={20} height={20} className="invert" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{homework.title}</h3>
              <p className="text-sm text-gray-600">{homework.subject.name} • {homework.teacher.firstName} {homework.teacher.lastName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Image src="/close.png" alt="Close" width={24} height={24} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* HOMEWORK DETAILS */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <span>📋</span>
            Assignment Details
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/date.png" alt="Assigned" width={16} height={16} />
                <span><strong>Assigned:</strong> {new Date(homework.assignedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Image src="/calendar.png" alt="Due" width={16} height={16} />
                <span><strong>Due:</strong> {new Date(homework.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              {homework.totalPoints && (
                <div className="flex items-center gap-2 mb-2">
                  <span>🎯</span>
                  <span><strong>Points:</strong> {homework.totalPoints}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span>⏰</span>
                <span><strong>Time Left:</strong> {submissionDetails?.timeUntilDue || "Calculating..."}</span>
              </div>
            </div>
          </div>

          {homework.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Description:</h5>
              <p className="text-sm text-gray-600">{homework.description}</p>
            </div>
          )}

          {homework.instructions && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h5>
              <p className="text-sm text-blue-800">{homework.instructions}</p>
            </div>
          )}

          {/* TEACHER ATTACHMENTS */}
          {homework.attachments && homework.attachments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Teacher Attachments:</h5>
              <div className="space-y-2">
                {homework.attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">
                      {attachment.fileType === "IMAGE" ? "🖼️" :
                       attachment.fileType === "DOCUMENT" ? "📄" :
                       attachment.fileType === "AUDIO" ? "🎵" :
                       attachment.fileType === "VIDEO" ? "🎬" :
                       attachment.fileType === "LINK" ? "🔗" : "📎"}
                    </span>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {attachment.originalName}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SUBMISSION FORM */}
        {submissionDetails?.canSubmit && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <span>📝</span>
              Your Submission
            </h4>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                id="content"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your homework content here..."
              />
            </div>

            {/* MULTIMEDIA UPLOADS (Coming Soon) */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Image src="/upload.png" alt="Upload" width={48} height={48} className="mx-auto opacity-50" />
              </div>
              <p className="text-gray-500 text-sm">
                Multimedia attachment support (images, documents, audio recordings) will be available soon.
              </p>
            </div>
          </div>
        )}

        {/* EXISTING SUBMISSION */}
        {submissionDetails?.hasSubmission && (
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-900 mb-3">Your Current Submission</h4>
            <div className="text-sm text-green-800">
              <p><strong>Submitted:</strong> {submissionDetails.submission?.submissionDate ? new Date(submissionDetails.submission.submissionDate).toLocaleDateString() : "Not yet submitted"}</p>
              <p><strong>Status:</strong> {submissionDetails.submissionStatus}</p>
              {submissionDetails.submission?.grade !== null && submissionDetails.submission?.grade !== undefined && (
                <p><strong>Grade:</strong> {submissionDetails.submission.grade}%</p>
              )}
              {submissionDetails.submission?.feedback && (
                <div className="mt-2">
                  <p><strong>Teacher Feedback:</strong></p>
                  <p className="mt-1">{submissionDetails.submission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMISSION STATUS */}
        {!submissionDetails?.canSubmit && (
          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="font-medium text-yellow-900 mb-2">Submission Status</h4>
            <p className="text-sm text-yellow-800">
              {submissionDetails?.isOverdue && !homework.allowLateSubmission
                ? "Deadline has passed and late submissions are not allowed."
                : submissionDetails?.hasSubmission && submissionDetails?.submissionStatus === "GRADED"
                ? "This homework has been graded and cannot be resubmitted."
                : "This homework is not accepting submissions at this time."}
            </p>
          </div>
        )}

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to List
          </button>
          
          {submissionDetails?.canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={loading || !submissionContent.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Submitting..." : submissionDetails?.hasSubmission ? "Update Submission" : "Submit Homework"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHomeworkSubmission;
