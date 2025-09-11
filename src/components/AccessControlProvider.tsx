"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "SUPERVISOR" | "ADMIN";
  permissions: string[];
  assignedClasses?: string[];
  assignedSubjects?: string[];
  supervisedClasses?: string[];
}

interface AccessControlContextType {
  user: User | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  canEditTimetable: (timetableId: string) => boolean;
  canViewTimetable: (timetableId: string) => boolean;
  canManageTopics: (classId: string, subjectId: string) => boolean;
  canViewAnalytics: (scope: "own" | "supervised" | "all") => boolean;
  canExportData: (scope: "own" | "supervised" | "all") => boolean;
  isTeacher: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error("useAccessControl must be used within an AccessControlProvider");
  }
  return context;
};

interface AccessControlProviderProps {
  children: ReactNode;
  userId: string;
}

export const AccessControlProvider = ({ children, userId }: AccessControlProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/permissions`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.error("Failed to fetch user permissions");
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserPermissions();
    }
  }, [userId]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === "ADMIN";
  };

  const canEditTimetable = (timetableId: string): boolean => {
    if (!user) return false;
    
    // Admins can edit all timetables
    if (user.role === "ADMIN") return true;
    
    // Supervisors can edit timetables for their supervised classes
    if (user.role === "SUPERVISOR") {
      return hasPermission("timetable.edit.supervised");
    }
    
    // Teachers can only edit their own timetables
    if (user.role === "TEACHER") {
      return hasPermission("timetable.edit.own");
    }
    
    return false;
  };

  const canViewTimetable = (timetableId: string): boolean => {
    if (!user) return false;
    
    // Everyone can view timetables they have access to
    return hasPermission("timetable.view.own") || 
           hasPermission("timetable.view.supervised") || 
           hasPermission("timetable.view.all");
  };

  const canManageTopics = (classId: string, subjectId: string): boolean => {
    if (!user) return false;
    
    // Admins can manage all topics
    if (user.role === "ADMIN") return true;
    
    // Supervisors can manage topics for supervised classes
    if (user.role === "SUPERVISOR") {
      return (user.supervisedClasses?.includes(classId) ?? false) && 
             hasPermission("topics.manage.supervised");
    }
    
    // Teachers can manage topics for their assigned classes and subjects
    if (user.role === "TEACHER") {
      return (user.assignedClasses?.includes(classId) ?? false) && 
             (user.assignedSubjects?.includes(subjectId) ?? false) &&
             hasPermission("topics.manage.own");
    }
    
    return false;
  };

  const canViewAnalytics = (scope: "own" | "supervised" | "all"): boolean => {
    if (!user) return false;
    
    switch (scope) {
      case "own":
        return hasPermission("analytics.view.own");
      case "supervised":
        return hasPermission("analytics.view.supervised") && user.role === "SUPERVISOR";
      case "all":
        return hasPermission("analytics.view.all") && user.role === "ADMIN";
      default:
        return false;
    }
  };

  const canExportData = (scope: "own" | "supervised" | "all"): boolean => {
    if (!user) return false;
    
    switch (scope) {
      case "own":
        return hasPermission("export.own");
      case "supervised":
        return hasPermission("export.supervised") && user.role === "SUPERVISOR";
      case "all":
        return hasPermission("export.all") && user.role === "ADMIN";
      default:
        return false;
    }
  };

  const value: AccessControlContextType = {
    user,
    loading,
    hasPermission,
    canEditTimetable,
    canViewTimetable,
    canManageTopics,
    canViewAnalytics,
    canExportData,
    isTeacher: user?.role === "TEACHER",
    isSupervisor: user?.role === "SUPERVISOR",
    isAdmin: user?.role === "ADMIN"
  };

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
};

// Permission constants for easy reference
export const PERMISSIONS = {
  // Timetable permissions
  TIMETABLE_VIEW_OWN: "timetable.view.own",
  TIMETABLE_VIEW_SUPERVISED: "timetable.view.supervised",
  TIMETABLE_VIEW_ALL: "timetable.view.all",
  TIMETABLE_EDIT_OWN: "timetable.edit.own",
  TIMETABLE_EDIT_SUPERVISED: "timetable.edit.supervised",
  TIMETABLE_EDIT_ALL: "timetable.edit.all",
  
  // Topics permissions
  TOPICS_VIEW_OWN: "topics.view.own",
  TOPICS_VIEW_SUPERVISED: "topics.view.supervised",
  TOPICS_VIEW_ALL: "topics.view.all",
  TOPICS_MANAGE_OWN: "topics.manage.own",
  TOPICS_MANAGE_SUPERVISED: "topics.manage.supervised",
  TOPICS_MANAGE_ALL: "topics.manage.all",
  
  // Analytics permissions
  ANALYTICS_VIEW_OWN: "analytics.view.own",
  ANALYTICS_VIEW_SUPERVISED: "analytics.view.supervised",
  ANALYTICS_VIEW_ALL: "analytics.view.all",
  
  // Export permissions
  EXPORT_OWN: "export.own",
  EXPORT_SUPERVISED: "export.supervised",
  EXPORT_ALL: "export.all",
  
  // Admin permissions
  USER_MANAGEMENT: "user.management",
  SYSTEM_SETTINGS: "system.settings"
} as const;

// Default permissions by role
export const DEFAULT_PERMISSIONS = {
  TEACHER: [
    PERMISSIONS.TIMETABLE_VIEW_OWN,
    PERMISSIONS.TIMETABLE_EDIT_OWN,
    PERMISSIONS.TOPICS_VIEW_OWN,
    PERMISSIONS.TOPICS_MANAGE_OWN,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.EXPORT_OWN
  ],
  SUPERVISOR: [
    PERMISSIONS.TIMETABLE_VIEW_OWN,
    PERMISSIONS.TIMETABLE_VIEW_SUPERVISED,
    PERMISSIONS.TIMETABLE_EDIT_SUPERVISED,
    PERMISSIONS.TOPICS_VIEW_OWN,
    PERMISSIONS.TOPICS_VIEW_SUPERVISED,
    PERMISSIONS.TOPICS_MANAGE_SUPERVISED,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.ANALYTICS_VIEW_SUPERVISED,
    PERMISSIONS.EXPORT_OWN,
    PERMISSIONS.EXPORT_SUPERVISED
  ],
  ADMIN: [
    // Admins have all permissions
    ...Object.values(PERMISSIONS)
  ]
} as const;
