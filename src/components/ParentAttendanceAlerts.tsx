"use client";

import { useState } from "react";
import Image from "next/image";

interface ParentAttendanceAlertsProps {
  alerts: any[];
  child: any;
  parentData: any;
}

const ParentAttendanceAlerts = ({
  alerts,
  child,
  parentData,
}: ParentAttendanceAlertsProps) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  const handleDismissAlert = (alertIndex: number) => {
    const alertId = `${child?.id}-${alertIndex}`;
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const visibleAlerts = alerts.filter((_, index) => {
    const alertId = `${child?.id}-${index}`;
    return !dismissedAlerts.includes(alertId);
  });

  const displayedAlerts = showAllAlerts ? visibleAlerts : visibleAlerts.slice(0, 3);

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "critical":
        return {
          container: "bg-red-50 border-red-200 border-l-4 border-l-red-500",
          icon: "text-red-600",
          title: "text-red-900",
          message: "text-red-800",
          button: "bg-red-100 hover:bg-red-200 text-red-800"
        };
      case "warning":
        return {
          container: "bg-orange-50 border-orange-200 border-l-4 border-l-orange-500",
          icon: "text-orange-600",
          title: "text-orange-900",
          message: "text-orange-800",
          button: "bg-orange-100 hover:bg-orange-200 text-orange-800"
        };
      case "info":
        return {
          container: "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500",
          icon: "text-blue-600",
          title: "text-blue-900",
          message: "text-blue-800",
          button: "bg-blue-100 hover:bg-blue-200 text-blue-800"
        };
      case "success":
        return {
          container: "bg-green-50 border-green-200 border-l-4 border-l-green-500",
          icon: "text-green-600",
          title: "text-green-900",
          message: "text-green-800",
          button: "bg-green-100 hover:bg-green-200 text-green-800"
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200 border-l-4 border-l-gray-500",
          icon: "text-gray-600",
          title: "text-gray-900",
          message: "text-gray-800",
          button: "bg-gray-100 hover:bg-gray-200 text-gray-800"
        };
    }
  };

  const getPriorityOrder = (priority: string) => {
    switch (priority) {
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 0;
    }
  };

  // Sort alerts by priority
  const sortedAlerts = [...displayedAlerts].sort((a, b) => 
    getPriorityOrder(b.priority) - getPriorityOrder(a.priority)
  );

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🚨</span>
          Attendance Alerts & Notifications
        </h3>
        {visibleAlerts.length > 3 && (
          <button
            onClick={() => setShowAllAlerts(!showAllAlerts)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAllAlerts ? "Show Less" : `Show All (${visibleAlerts.length})`}
          </button>
        )}
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {sortedAlerts.map((alert, index) => {
          const style = getAlertStyle(alert.type);
          const originalIndex = alerts.findIndex(a => a === alert);
          
          return (
            <div
              key={`${child?.id}-${originalIndex}`}
              className={`${style.container} rounded-lg p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div className={`${style.icon} text-xl mt-0.5`}>
                    {alert.icon || "🔔"}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className={`${style.title} font-semibold mb-1`}>
                      {alert.title}
                    </div>
                    <div className={`${style.message} text-sm leading-relaxed`}>
                      {alert.message}
                    </div>
                    
                    {/* Priority Badge */}
                    {alert.priority && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          alert.priority === "high" ? "bg-red-100 text-red-800" :
                          alert.priority === "medium" ? "bg-orange-100 text-orange-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {alert.priority === "high" ? "🔥 High Priority" :
                           alert.priority === "medium" ? "⚠️ Medium Priority" :
                           "ℹ️ Low Priority"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismissAlert(originalIndex)}
                  className={`${style.button} px-2 py-1 rounded-md text-xs font-medium transition-colors ml-3`}
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {visibleAlerts.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-700">
              <strong>Alert Summary:</strong> {visibleAlerts.length} active notification{visibleAlerts.length !== 1 ? 's' : ''} for {child?.firstName}
            </div>
            <div className="flex items-center gap-4">
              {visibleAlerts.filter(a => a.priority === "high").length > 0 && (
                <span className="text-red-600 font-medium">
                  {visibleAlerts.filter(a => a.priority === "high").length} High Priority
                </span>
              )}
              {visibleAlerts.filter(a => a.priority === "medium").length > 0 && (
                <span className="text-orange-600 font-medium">
                  {visibleAlerts.filter(a => a.priority === "medium").length} Medium Priority
                </span>
              )}
              {visibleAlerts.filter(a => a.priority === "low").length > 0 && (
                <span className="text-blue-600 font-medium">
                  {visibleAlerts.filter(a => a.priority === "low").length} Low Priority
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Recommendations */}
      {visibleAlerts.some(a => a.priority === "high" || a.priority === "medium") && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>💡</span>
            Recommended Actions
          </h4>
          <div className="text-sm text-blue-800 space-y-2">
            {visibleAlerts.some(a => a.type === "critical") && (
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">🚨</span>
                <div>
                  <strong>Immediate Action Required:</strong> Contact the school immediately to discuss critical attendance issues.
                </div>
              </div>
            )}
            
            {visibleAlerts.some(a => a.priority === "high") && (
              <div className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">📞</span>
                <div>
                  <strong>Contact School:</strong> Schedule a meeting with {child?.firstName}'s teacher to discuss attendance concerns.
                </div>
              </div>
            )}
            
            {visibleAlerts.some(a => a.message.includes("late") || a.message.includes("punctuality")) && (
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">⏰</span>
                <div>
                  <strong>Morning Routine:</strong> Consider adjusting bedtime and morning routines to improve punctuality.
                </div>
              </div>
            )}
            
            {visibleAlerts.some(a => a.message.includes("absent") || a.message.includes("missed")) && (
              <div className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">🏥</span>
                <div>
                  <strong>Health Check:</strong> Ensure {child?.firstName} is getting adequate sleep and nutrition. Consider a health check-up if frequent illnesses.
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">📊</span>
              <div>
                <strong>Monitor Progress:</strong> Use the charts and analytics sections to track attendance improvements over time.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Positive Recognition */}
      {visibleAlerts.some(a => a.type === "success") && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <span>🎉</span>
            Celebrate Success!
          </h4>
          <div className="text-sm text-green-800">
            {child?.firstName} is doing great with attendance! Continue to:
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Maintain consistent daily routines</li>
              <li>• Acknowledge and celebrate their efforts</li>
              <li>• Share positive feedback with them</li>
              <li>• Continue monitoring to maintain excellence</li>
            </ul>
          </div>
        </div>
      )}

      {/* No Alerts State */}
      {visibleAlerts.length === 0 && alerts.length > 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-gray-600">All alerts have been dismissed</div>
          <button
            onClick={() => setDismissedAlerts([])}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Show dismissed alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default ParentAttendanceAlerts;
