"use client";

import { useState } from "react";
import Image from "next/image";

interface ParentInsightsAlertsProps {
  insights: any;
  childName: string;
}

const ParentInsightsAlerts = ({ insights, childName }: ParentInsightsAlertsProps) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  if (!insights || (!insights.insights?.length && !insights.alerts?.length)) {
    return null;
  }

  const handleDismissAlert = (alertIndex: number) => {
    setDismissedAlerts(prev => new Set([...prev, `alert-${alertIndex}`]));
  };

  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId);
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "danger":
        return "bg-red-50 border-red-200 text-red-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "danger":
        return "🚨";
      case "info":
        return "ℹ️";
      default:
        return "📝";
    }
  };

  const visibleAlerts = insights.alerts?.filter((_: any, index: number) => 
    !dismissedAlerts.has(`alert-${index}`)
  ) || [];

  const visibleInsights = insights.insights || [];

  return (
    <div className="mb-6 space-y-4">
      {/* SUCCESS INSIGHTS */}
      {visibleInsights.length > 0 && (
        <div className="space-y-3">
          {visibleInsights.map((insight: any, index: number) => (
            <div
              key={`insight-${index}`}
              className={`p-4 border rounded-lg ${getAlertColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{insight.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERTS REQUIRING ATTENTION */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span>🚨</span>
            Areas Requiring Attention
          </div>
          
          {visibleAlerts.map((alert: any, index: number) => (
            <div
              key={`alert-${index}`}
              className={`border rounded-lg ${getAlertColor(alert.type)}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-lg flex-shrink-0">{alert.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        {alert.actionable && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      
                      {/* Failed Exams Details */}
                      {alert.details && alert.details.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleAlertExpansion(`alert-${index}`)}
                            className="text-xs font-medium text-current hover:underline flex items-center gap-1"
                          >
                            {expandedAlert === `alert-${index}` ? "Hide Details" : "View Details"}
                            <span className={`transform transition-transform ${
                              expandedAlert === `alert-${index}` ? "rotate-180" : ""
                            }`}>
                              ↓
                            </span>
                          </button>
                          
                          {expandedAlert === `alert-${index}` && (
                            <div className="mt-2 space-y-2">
                              {alert.details.map((detail: any, detailIndex: number) => (
                                <div
                                  key={detailIndex}
                                  className="bg-white/50 p-3 rounded border text-xs"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium">{detail.subject}</span>
                                    <span className="text-red-600 font-bold">{detail.score}</span>
                                  </div>
                                  <div className="text-gray-600 mb-1">{detail.title}</div>
                                  <div className="text-gray-500">
                                    {new Date(detail.date).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action Recommendations */}
                      {alert.actionable && (
                        <div className="mt-3 p-3 bg-white/50 rounded border">
                          <div className="text-xs font-medium mb-2">💡 Recommended Actions:</div>
                          <div className="text-xs space-y-1">
                            {alert.type === "warning" && alert.title.includes("Failed Exams") && (
                              <>
                                <div>• Schedule a meeting with subject teachers</div>
                                <div>• Review study methods and create improvement plan</div>
                                <div>• Consider additional tutoring or study support</div>
                                <div>• Monitor homework completion and understanding</div>
                              </>
                            )}
                            {alert.type === "warning" && alert.title.includes("Subjects Requiring Focus") && (
                              <>
                                <div>• Allocate extra study time for weak subjects</div>
                                <div>• Seek help from teachers or tutors</div>
                                <div>• Use different learning methods (visual, practice, etc.)</div>
                                <div>• Break down complex topics into smaller parts</div>
                              </>
                            )}
                            {alert.type === "danger" && alert.title.includes("Academic Support") && (
                              <>
                                <div>• Urgent: Schedule parent-teacher conference</div>
                                <div>• Develop comprehensive academic support plan</div>
                                <div>• Consider professional tutoring services</div>
                                <div>• Evaluate learning environment and study habits</div>
                                <div>• Monitor daily academic progress closely</div>
                              </>
                            )}
                            {alert.type === "info" && alert.title.includes("Below Class Average") && (
                              <>
                                <div>• Discuss performance with teachers</div>
                                <div>• Compare study methods with top-performing students</div>
                                <div>• Focus on understanding fundamental concepts</div>
                                <div>• Increase practice time for challenging subjects</div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDismissAlert(index)}
                    className="flex-shrink-0 p-1 hover:bg-white/20 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
                    title="Dismiss alert"
                  >
                    <Image src="/close.png" alt="Close" width={14} height={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUMMARY STATISTICS */}
      {insights.summary && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium text-gray-700">Academic Insights Summary</div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {insights.summary.totalInsights > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {insights.summary.totalInsights} Positive Insight{insights.summary.totalInsights !== 1 ? 's' : ''}
                </span>
              )}
              {insights.summary.totalAlerts > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  {insights.summary.totalAlerts} Alert{insights.summary.totalAlerts !== 1 ? 's' : ''}
                </span>
              )}
              {insights.summary.actionableAlerts > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {insights.summary.actionableAlerts} Action{insights.summary.actionableAlerts !== 1 ? 's' : ''} Required
                </span>
              )}
            </div>
          </div>
          
          {dismissedAlerts.size > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {dismissedAlerts.size} alert{dismissedAlerts.size !== 1 ? 's' : ''} dismissed. 
              <button 
                onClick={() => setDismissedAlerts(new Set())}
                className="ml-2 text-blue-600 hover:underline"
              >
                Show all alerts
              </button>
            </div>
          )}
        </div>
      )}

      {/* PARENT GUIDANCE */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">👨‍👩‍👧‍👦</span>
          <div>
            <h4 className="font-medium text-indigo-900 mb-2">Parent Support Tips</h4>
            <div className="text-sm text-indigo-800 space-y-1">
              <div>• <strong>Stay Engaged:</strong> Regular communication with {childName} about their studies shows you care about their education.</div>
              <div>• <strong>Create Routine:</strong> Establish consistent study times and a quiet learning environment at home.</div>
              <div>• <strong>Celebrate Success:</strong> Acknowledge improvements and achievements, no matter how small.</div>
              <div>• <strong>Address Concerns Early:</strong> Don't wait for problems to escalate - reach out to teachers when you notice issues.</div>
              <div>• <strong>Be Patient:</strong> Academic improvement takes time. Support {childName} through challenges with patience and encouragement.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentInsightsAlerts;
