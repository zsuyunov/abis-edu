"use client";

import { useState } from "react";
import { Calendar, Download, ExternalLink, Smartphone, Monitor, Check, AlertCircle, Users, BookOpen, Clock } from "lucide-react";

interface ParentCalendarSyncProps {
  parentId: string;
  children: any[];
  selectedChildId?: string;
  timetableData: any;
}

const ParentCalendarSync = ({ parentId, children, selectedChildId, timetableData }: ParentCalendarSyncProps) => {
  const [syncStatus, setSyncStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [calendarUrl, setCalendarUrl] = useState<string>("");
  const [syncMode, setSyncMode] = useState<"single" | "all">("single");

  const generateCalendarFile = async (format: "ics" | "google" | "outlook") => {
    setSyncStatus("generating");
    
    try {
      const response = await fetch(`/api/parent-timetables/calendar-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          parentId,
          childId: syncMode === "single" ? selectedChildId : null,
          format,
          syncAllChildren: syncMode === "all",
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
          const fileName = syncMode === "all" 
            ? `family-timetable-${new Date().toISOString().split('T')[0]}.ics`
            : `${data.childName}-timetable-${new Date().toISOString().split('T')[0]}.ics`;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (format === "google") {
          window.open(data.googleCalendarUrl, '_blank');
        } else if (format === "outlook") {
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

  const selectedChild = children.find(child => child.id === selectedChildId);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl border border-blue-200 p-8 shadow-lg">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Family Calendar Sync
          </h3>
          <p className="text-gray-600 mt-1">Sync your children's timetables with your personal calendar</p>
        </div>
      </div>

      {/* Sync Mode Selection */}
      {children.length > 1 && (
        <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Choose Sync Mode
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSyncMode("single")}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                syncMode === "single"
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="text-left">
                <div className="font-medium mb-1">Single Child</div>
                <div className="text-sm opacity-75">
                  {selectedChild ? `${selectedChild.firstName}'s schedule only` : "Select a child first"}
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setSyncMode("all")}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                syncMode === "all"
                  ? "border-purple-500 bg-purple-50 text-purple-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="text-left">
                <div className="font-medium mb-1">All Children</div>
                <div className="text-sm opacity-75">
                  Combined schedule for all {children.length} children
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Quick Sync Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => generateCalendarFile("google")}
          disabled={syncStatus === "generating" || (syncMode === "single" && !selectedChildId)}
          className="group flex items-center gap-4 p-6 border-2 border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-900">Google Calendar</div>
            <div className="text-sm text-gray-600">Add to Google Calendar</div>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
        </button>

        <button
          onClick={() => generateCalendarFile("outlook")}
          disabled={syncStatus === "generating" || (syncMode === "single" && !selectedChildId)}
          className="group flex items-center gap-4 p-6 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-900">Outlook</div>
            <div className="text-sm text-gray-600">Add to Outlook Calendar</div>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </button>

        <button
          onClick={() => generateCalendarFile("ics")}
          disabled={syncStatus === "generating" || (syncMode === "single" && !selectedChildId)}
          className="group flex items-center gap-4 p-6 border-2 border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left flex-1">
            <div className="font-semibold text-gray-900">Download ICS</div>
            <div className="text-sm text-gray-600">Universal calendar file</div>
          </div>
          <Download className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </button>
      </div>

      {/* Status Messages */}
      {syncStatus === "generating" && (
        <div className="flex items-center gap-3 p-6 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 font-medium">
            Generating {syncMode === "all" ? "family" : "child"} calendar file...
          </span>
        </div>
      )}

      {syncStatus === "success" && (
        <div className="flex items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-xl mb-6">
          <Check className="w-6 h-6 text-green-600" />
          <span className="text-green-800 font-medium">Calendar sync completed successfully!</span>
        </div>
      )}

      {syncStatus === "error" && (
        <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <span className="text-red-800 font-medium">Failed to sync calendar. Please try again.</span>
        </div>
      )}

      {/* Subscription URL */}
      {calendarUrl && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Live Calendar Subscription
          </h4>
          <p className="text-gray-600 mb-4">
            Use this URL to subscribe to your {syncMode === "all" ? "family" : "child's"} timetable. 
            It will automatically update when changes are made.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={calendarUrl}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
            />
            <button
              onClick={copySubscriptionUrl}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-600" />
          How to sync with your devices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <div className="font-medium text-gray-900">Mobile Devices</div>
                <div className="text-gray-600">Download the ICS file and open it with your default calendar app</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">💻</span>
              <div>
                <div className="font-medium text-gray-900">Desktop</div>
                <div className="text-gray-600">Use the Google Calendar or Outlook buttons for direct import</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <div className="font-medium text-gray-900">Auto-sync</div>
                <div className="text-gray-600">Use the subscription URL for automatic updates when timetables change</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <div>
                <div className="font-medium text-gray-900">Family Mode</div>
                <div className="text-gray-600">Sync all children's schedules into one family calendar</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {timetableData && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {syncMode === "all" 
                  ? children.reduce((sum, child) => sum + (child.totalClasses || 0), 0)
                  : selectedChild?.totalClasses || 0
                }
              </div>
              <div className="text-xs text-gray-600">Total Classes</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {syncMode === "all" 
                  ? children.reduce((sum, child) => sum + (child.completedTopics || 0), 0)
                  : selectedChild?.completedTopics || 0
                }
              </div>
              <div className="text-xs text-gray-600">Completed Topics</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {syncMode === "all" ? children.length : 1}
              </div>
              <div className="text-xs text-gray-600">
                {syncMode === "all" ? "Children" : "Child"}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {syncMode === "all" 
                  ? [...new Set(children.flatMap(child => child.subjects || []))].length
                  : selectedChild?.subjects?.length || 0
                }
              </div>
              <div className="text-xs text-gray-600">Subjects</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentCalendarSync;
