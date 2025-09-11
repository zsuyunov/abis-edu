/*
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  BookOpen,
  User,
  X,
  Info,
  Users,
  TrendingUp
} from "lucide-react";

interface Notification {
  id: string;
  type: "reminder" | "update" | "info" | "success" | "alert";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  childName?: string;
}

interface ParentNotificationsProps {
  parentId: string;
}

const ParentNotifications = ({ parentId }: ParentNotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [parentId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/parent/notifications?parentId=${parentId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/parent/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/parent/notifications/read-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "update":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "info":
        return <Info className="w-5 h-5 text-gray-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "border-blue-200 bg-blue-50";
      case "update":
        return "border-orange-200 bg-orange-50";
      case "info":
        return "border-gray-200 bg-gray-50";
      case "success":
        return "border-green-200 bg-green-50";
      case "alert":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6" />
            <CardTitle className="text-xl">Family Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-white text-red-600">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllAsRead} className="text-white hover:bg-white/20">
              Mark all as read
            </Button>
          )}
        </div>
        <CardDescription className="text-blue-100">
          Stay updated with your children's school activities and important announcements
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up with your children's activities!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  notification.isRead ? "opacity-60" : ""
                } ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start gap-4">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        {notification.childName && (
                          <Badge variant="outline" className="text-xs bg-white">
                            {notification.childName}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {notification.message}
                    </p>
                    {notification.actionUrl && notification.actionText && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => window.location.href = notification.actionUrl!}
                      >
                        {notification.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats }
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-blue-800">Total</p>
              <p className="text-lg font-bold text-blue-900">{notifications.length}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-orange-800">Reminders</p>
              <p className="text-lg font-bold text-orange-900">
                {notifications.filter(n => n.type === "reminder").length}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-800">Updates</p>
              <p className="text-lg font-bold text-green-900">
                {notifications.filter(n => n.type === "update").length}
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-purple-800">Unread</p>
              <p className="text-lg font-bold text-purple-900">{unreadCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParentNotifications;

*/