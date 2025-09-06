"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface TeacherNotificationsProps {
  teacherId: string;
}

const TeacherNotifications = ({ teacherId }: TeacherNotificationsProps) => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [teacherId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/teacher-timetables/notifications?teacherId=${teacherId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-300 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "immediate":
        return "/calendar.png";
      case "upcoming":
        return "/lesson.png";
      case "no-topics":
        return "/create.png";
      case "overdue":
        return "/assignment.png";
      case "supervised":
        return "/teacher.png";
      default:
        return "/announcement.png";
    }
  };

  const formatTimeRemaining = (time: string, type: string) => {
    if (type === "immediate" || type === "upcoming") {
      return time;
    }
    return time;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!notifications.length && !summary?.totalNotifications) {
    return (
      <div className="bg-white rounded-md p-4">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="text-center py-6 text-gray-500">
          <Image
            src="/announcement.png"
            alt="No notifications"
            width={48}
            height={48}
            className="mx-auto mb-3 opacity-50"
          />
          <p>No notifications at this time</p>
        </div>
      </div>
    );
  }

  const highPriorityNotifications = notifications.filter((n: any) => n.priority === "high");
  const otherNotifications = notifications.filter((n: any) => n.priority !== "high");

  return (
    <div className="bg-white rounded-md p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          {summary?.totalNotifications > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {summary.totalNotifications}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? "Show Less" : "Show All"}
          </button>
        </div>
      </div>

      {/* SUMMARY BADGES */}
      {summary && (
        <div className="flex flex-wrap gap-2 mb-4">
          {summary.immediate > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full">
              {summary.immediate} starting soon
            </span>
          )}
          {summary.upcoming > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">
              {summary.upcoming} upcoming
            </span>
          )}
          {summary.withoutTopics > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
              {summary.withoutTopics} need topics
            </span>
          )}
          {summary.overdue > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full">
              {summary.overdue} overdue
            </span>
          )}
          {summary.supervised > 0 && summary.isSupervisor && (
            <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full">
              {summary.supervised} supervised
            </span>
          )}
        </div>
      )}

      {/* HIGH PRIORITY NOTIFICATIONS */}
      {highPriorityNotifications.length > 0 && (
        <div className="space-y-3 mb-4">
          {highPriorityNotifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`p-3 rounded-md border-l-4 ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start gap-3">
                <Image
                  src={getTypeIcon(notification.type)}
                  alt={notification.type}
                  width={20}
                  height={20}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{notification.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Image src="/calendar.png" alt="Time" width={12} height={12} />
                      {formatTimeRemaining(notification.time, notification.type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Image src="/singleClass.png" alt="Location" width={12} height={12} />
                      {notification.location}
                    </span>
                    {!notification.hasTopics && (
                      <span className="text-red-600">⚠ No topics</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTHER NOTIFICATIONS */}
      {(isExpanded || highPriorityNotifications.length === 0) && otherNotifications.length > 0 && (
        <div className="space-y-2">
          {otherNotifications.slice(0, isExpanded ? 10 : 3).map((notification: any) => (
            <div
              key={notification.id}
              className={`p-3 rounded-md border ${getPriorityColor(notification.priority).replace('border-', 'border-').replace('-300', '-200')}`}
            >
              <div className="flex items-start gap-3">
                <Image
                  src={getTypeIcon(notification.type)}
                  alt={notification.type}
                  width={16}
                  height={16}
                  className="mt-1 opacity-70"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-xs opacity-75 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs opacity-70">
                    <span>{formatTimeRemaining(notification.time, notification.type)}</span>
                    <span>{notification.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW ALL LINK */}
      {notifications.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            href="/teacher/timetables"
            className="text-sm text-lamaSky hover:text-blue-600 font-medium flex items-center gap-2"
          >
            <span>View Full Timetable</span>
            <Image src="/view.png" alt="View" width={14} height={14} />
          </Link>
        </div>
      )}

      {/* REFRESH INDICATOR */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        Auto-refreshes every 5 minutes
      </div>
    </div>
  );
};

export default TeacherNotifications;
