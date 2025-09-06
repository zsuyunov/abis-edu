"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ParentNotificationsProps {
  parentId: string;
}

const ParentNotifications = ({ parentId }: ParentNotificationsProps) => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState<any>({});
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>("");

  useEffect(() => {
    fetchNotifications();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [parentId, selectedChild]);

  const fetchNotifications = async () => {
    try {
      const queryParams = new URLSearchParams({
        parentId,
        ...(selectedChild && { childId: selectedChild }),
      });

      const response = await fetch(`/api/parent-timetables/notifications?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setSummary(data.summary || {});
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "upcoming":
        return { icon: "/lesson.png", color: "text-red-600 bg-red-100" };
      case "next":
        return { icon: "/calendar.png", color: "text-blue-600 bg-blue-100" };
      case "tomorrow":
        return { icon: "/date.png", color: "text-purple-600 bg-purple-100" };
      case "new-topic":
        return { icon: "/create.png", color: "text-green-600 bg-green-100" };
      case "timetable-update":
        return { icon: "/update.png", color: "text-orange-600 bg-orange-100" };
      default:
        return { icon: "/announcement.png", color: "text-gray-600 bg-gray-100" };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTimeAgo = (notification: any) => {
    // For now, we'll show relative time based on notification type
    switch (notification.type) {
      case "upcoming":
        return "Starting soon";
      case "next":
        return "Next class";
      case "tomorrow":
        return "Tomorrow";
      case "new-topic":
        return "Recently added";
      case "timetable-update":
        return "Recently updated";
      default:
        return "Recent";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md">
        <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Image src="/announcement.png" alt="Notifications" width={20} height={20} />
          Children's Updates
        </h1>
        <button
          onClick={fetchNotifications}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh notifications"
        >
          <Image src="/update.png" alt="Refresh" width={16} height={16} />
        </button>
      </div>

      {/* CHILD FILTER (if multiple children) */}
      {children.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent"
          >
            <option value="">All Children</option>
            {children.map((child: any) => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* QUICK SUMMARY */}
      {summary.totalNotifications > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
            <div className="font-bold text-red-600">{summary.upcoming || 0}</div>
            <div className="text-red-700">Starting Soon</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
            <div className="font-bold text-blue-600">{summary.next || 0}</div>
            <div className="text-blue-700">Coming Up</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
            <div className="font-bold text-green-600">{summary.newTopics || 0}</div>
            <div className="text-green-700">New Topics</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-2 text-center">
            <div className="font-bold text-purple-600">{summary.tomorrow || 0}</div>
            <div className="text-purple-700">Tomorrow</div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <Image 
              src="/announcement.png" 
              alt="No notifications" 
              width={48} 
              height={48} 
              className="mx-auto mb-3 opacity-50"
            />
            <p className="text-gray-600 text-sm">No updates for your children right now</p>
            <p className="text-gray-500 text-xs mt-1">Check back later for new notifications</p>
          </div>
        ) : (
          notifications.map((notification: any) => {
            const { icon, color } = getNotificationIcon(notification.type);
            
            return (
              <div
                key={notification.id}
                className={`p-3 rounded-md border transition-colors hover:shadow-sm ${
                  notification.priority === "high" 
                    ? "bg-red-50 border-red-200" 
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Image src={icon} alt={notification.type} width={14} height={14} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-1 leading-tight">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Image src="/lesson.png" alt="Time" width={12} height={12} />
                          {notification.time}
                        </span>
                        {notification.location && (
                          <span className="flex items-center gap-1">
                            <Image src="/singleClass.png" alt="Location" width={12} height={12} />
                            {notification.location}
                          </span>
                        )}
                      </div>
                      <span>{getTimeAgo(notification)}</span>
                    </div>
                    
                    {notification.hasTopics && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          📚 Has lesson content
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VIEW ALL LINK */}
      {notifications.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <a
            href="/parent/timetables"
            className="block text-center text-sm text-lamaSky hover:text-blue-600 font-medium transition-colors"
          >
            View Full Timetables →
          </a>
        </div>
      )}

      {/* PARENT TIPS */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-xs font-medium text-blue-900 mb-1 flex items-center gap-1">
          <Image src="/parent.png" alt="Tip" width={12} height={12} />
          Parent Tips
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div>• Red notifications need immediate attention</div>
          <div>• Blue notifications are helpful reminders</div>
          <div>• Green badges show new learning content available</div>
          {children.length > 1 && (
            <div>• Use the dropdown to filter by specific child</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentNotifications;
