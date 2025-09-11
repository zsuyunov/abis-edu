"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Clock, CheckCircle, AlertTriangle, Utensils } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notificationData, isLoading } = useQuery({
    queryKey: ["meal-approval-notifications", userId],
    queryFn: async () => {
      const response = await fetch("/api/notifications/meal-approvals");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meal_plan_approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "meal_plan_rejected":
        return <X className="w-4 h-4 text-red-600" />;
      case "meal_plan_auto_approved":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "meal_plan_review_needed":
        return <Utensils className="w-4 h-4 text-purple-600" />;
      case "meal_plan_urgent_review":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "meal_plan_approved":
        return "border-l-green-500 bg-green-50";
      case "meal_plan_rejected":
        return "border-l-red-500 bg-red-50";
      case "meal_plan_auto_approved":
        return "border-l-blue-500 bg-blue-50";
      case "meal_plan_review_needed":
        return "border-l-purple-500 bg-purple-50";
      case "meal_plan_urgent_review":
        return "border-l-orange-500 bg-orange-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} hover:bg-gray-50 transition-colors cursor-pointer`}
                      onClick={() => {
                        // Handle notification click - navigate to relevant page
                        if (notification.type.includes("meal_plan")) {
                          const mealPlanId = notification.data?.mealPlanId;
                          if (mealPlanId) {
                            if (notification.type === "meal_plan_review_needed" || notification.type === "meal_plan_urgent_review") {
                              // Navigate to approval page
                              window.location.href = "/meal-approvals";
                            } else {
                              // Navigate to meal calendar or meal plan details
                              window.location.href = "/meal-calendar";
                            }
                          }
                        }
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    // Navigate to full notifications page
                    window.location.href = "/notifications";
                    setIsOpen(false);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
