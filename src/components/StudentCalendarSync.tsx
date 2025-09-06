"use client";

import { useState } from "react";
import { Calendar, Download, ExternalLink, Smartphone, Monitor, Check, AlertCircle } from "lucide-react";

interface StudentCalendarSyncProps {
  studentId: string;
  timetableData: any;
}

const StudentCalendarSync = ({ studentId, timetableData }: StudentCalendarSyncProps) => {
  const [syncStatus, setSyncStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [calendarUrl, setCalendarUrl] = useState<string>("");

  const generateCalendarFile = async (format: "ics" | "google" | "outlook") => {
    setSyncStatus("generating");
    
    try {
      const response = await fetch(`/api/student-timetables/calendar-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          studentId,
          format,
          academicYearId: timetableData?.currentAcademicYear?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (format === "ics") {
          // Download ICS file
          const blob = new Blob([data.icsContent], { type: "text/calendar" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `my-timetable-${new Date().toISOString().split('T')[0]}.ics`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (format === "google") {
          // Open Google Calendar import
          window.open(data.googleCalendarUrl, '_blank');
        } else if (format === "outlook") {
          // Open Outlook import
          window.open(data.outlookUrl, '_blank');
        }
        
        setCalendarUrl(data.subscriptionUrl || "");
        setSyncStatus("success");
      } else {
        setSyncStatus("error");
      }
    } catch (error) {
      console.error("Calendar sync error:", error);
      setSyncStatus("error");
    }
  };

  const copySubscriptionUrl = () => {
    if (calendarUrl) {
      navigator.clipboard.writeText(calendarUrl);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Calendar Sync</h3>
          <p className="text-sm text-gray-600">Sync your timetable with your favorite calendar app</p>
        </div>
      </div>

      {/* Quick Sync Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => generateCalendarFile("google")}
          disabled={syncStatus === "generating"}
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">Google Calendar</div>
            <div className="text-xs text-gray-600">Add to Google Calendar</div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </button>

        <button
          onClick={() => generateCalendarFile("outlook")}
          disabled={syncStatus === "generating"}
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">Outlook</div>
            <div className="text-xs text-gray-600">Add to Outlook Calendar</div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </button>

        <button
          onClick={() => generateCalendarFile("ics")}
          disabled={syncStatus === "generating"}
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Download className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">Download ICS</div>
            <div className="text-xs text-gray-600">Universal calendar file</div>
          </div>
          <Download className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
      </div>

      {/* Status Messages */}
      {syncStatus === "generating" && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-800">Generating calendar file...</span>
        </div>
      )}

      {syncStatus === "success" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Calendar sync completed successfully!</span>
        </div>
      )}

      {syncStatus === "error" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">Failed to sync calendar. Please try again.</span>
        </div>
      )}

      {/* Subscription URL */}
      {calendarUrl && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Live Calendar Subscription</h4>
          <p className="text-sm text-gray-600 mb-3">
            Use this URL to subscribe to your timetable. It will automatically update when changes are made.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={calendarUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            />
            <button
              onClick={copySubscriptionUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          How to sync with your devices
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <span className="font-medium">📱 Mobile:</span>
            <span>Download the ICS file and open it with your default calendar app</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">💻 Desktop:</span>
            <span>Use the Google Calendar or Outlook buttons for direct import</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">🔄 Auto-sync:</span>
            <span>Use the subscription URL for automatic updates when your timetable changes</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {timetableData?.timetables && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{timetableData.timetables.length}</div>
              <div className="text-xs text-gray-600">Total Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {timetableData.timetables.filter((t: any) => t.topics.length > 0).length}
              </div>
              <div className="text-xs text-gray-600">With Topics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {timetableData.subjects?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Subjects</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCalendarSync;
