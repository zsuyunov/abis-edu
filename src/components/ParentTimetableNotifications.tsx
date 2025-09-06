"use client";

import { useState, useEffect } from "react";
import { Bell, X, Clock, Calendar, AlertCircle, CheckCircle, Info, Users, BookOpen } from "lucide-react";

interface Notification {
  id: string;
  type: "daily_summary" | "timetable_change" | "new_topic" | "reminder" | "multi_child";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  childId?: string;
  childName?: string;
  timetableId?: string;
  subjectName?: string;
  priority: "low" | "medium" | "high";
}

interface ParentTimetableNotificationsProps {
  parentId: string;
  children: any[];
  onNotificationClick?: (notification: Notification) => void;
}

const ParentTimetableNotifications = ({ 
  parentId, 
  children,
  onNotificationClick 
}: ParentTimetableNotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [parentId, children]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent-notifications?parentId=${parentId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/parent-notifications/${notificationId}/read`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === "high" ? "w-5 h-5" : "w-4 h-4";
    
    switch (type) {
      case "daily_summary":
        return <Calendar className={`${iconClass} text-blue-600`} />;
      case "timetable_change":
        return <AlertCircle className={`${iconClass} text-orange-600`} />;
      case "new_topic":
        return <BookOpen className={`${iconClass} text-green-600`} />;
      case "multi_child":
        return <Users className={`${iconClass} text-purple-600`} />;
      case "reminder":
        return <Info className={`${iconClass} text-indigo-600`} />;
      default:
        return <Bell className={`${iconClass} text-gray-600`} />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean, priority: string) => {
    const opacity = read ? "bg-opacity-40" : "bg-opacity-100";
    const intensity = priority === "high" ? "100" : "50";
    
    switch (type) {
      case "daily_summary":
        return `bg-blue-${intensity} ${opacity} border-blue-200`;
      case "timetable_change":
        return `bg-orange-${intensity} ${opacity} border-orange-200`;
      case "new_topic":
        return `bg-green-${intensity} ${opacity} border-green-200`;
      case "multi_child":
        return `bg-purple-${intensity} ${opacity} border-purple-200`;
      case "reminder":
        return `bg-indigo-${intensity} ${opacity} border-indigo-200`;
      default:
        return `bg-gray-${intensity} ${opacity} border-gray-200`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>;
      case "medium":
        return <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>;
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => !n.read && n.priority === "high").length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
      >
        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <span className={`${
              highPriorityCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            } text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg`}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            {highPriorityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
            )}
          </div>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-3 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[32rem] overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Family Updates</h3>
                {children.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Monitoring {children.length} child{children.length !== 1 ? 'ren' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm font-medium text-blue-700">
                    {unreadCount} new update{unreadCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {highPriorityCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium text-red-700">
                      {highPriorityCount} urgent
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm">Loading updates...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h4 className="font-medium text-gray-900 mb-2">All caught up!</h4>
                <p className="text-sm text-gray-500">
                  No new updates for your {children.length > 1 ? 'children' : 'child'} right now
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 border-l-4 ${
                      getNotificationBgColor(notification.type, notification.read, notification.priority)
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-semibold ${
                              notification.read ? "text-gray-600" : "text-gray-900"
                            }`}>
                              {notification.title}
                            </h4>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className={`text-sm mt-1 leading-relaxed ${
                          notification.read ? "text-gray-500" : "text-gray-700"
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          {notification.childName && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              <Users className="w-3 h-3" />
                              {notification.childName}
                            </span>
                          )}
                          
                          {notification.subjectName && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              <BookOpen className="w-3 h-3" />
                              {notification.subjectName}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    // Mark all as read
                    notifications.forEach(notif => {
                      if (!notif.read) markAsRead(notif.id);
                    });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Mark all as read
                </button>
                
                <div className="text-xs text-gray-500">
                  Updates refresh every 5 minutes
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentTimetableNotifications;
