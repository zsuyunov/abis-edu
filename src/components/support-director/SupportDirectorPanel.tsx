/*
"use client";

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Calendar,
  Bell, 
  MessageSquare, 
  User, 
  Settings,
  Menu,
  X,
  ChefHat
} from "lucide-react";
import SupportDirectorDashboard from "./SupportDirectorDashboard";
import MealApprovals from "./MealApprovals";
import SupportDirectorMealCalendar from "./SupportDirectorMealCalendar";
import SupportDirectorEvents from "./SupportDirectorEvents";
import SupportDirectorAnnouncements from "./SupportDirectorAnnouncements";
import SupportDirectorMessages from "./SupportDirectorMessages";
import SupportDirectorProfile from "./SupportDirectorProfile";
import SupportDirectorSettings from "./SupportDirectorSettings";

interface SupportDirectorPanelProps {
  userId: string;
}

const SupportDirectorPanel = ({ userId }: SupportDirectorPanelProps) => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "meal-approvals", label: "Meal Approvals", icon: ClipboardCheck },
    { id: "meal-calendar", label: "Meal Calendar", icon: ChefHat },
    { id: "events", label: "Events", icon: Calendar },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <SupportDirectorDashboard userId={userId} />;
      case "meal-approvals":
        return <MealApprovals />;
      case "meal-calendar":
        return <SupportDirectorMealCalendar userId={userId} />;
      case "events":
        return <SupportDirectorEvents userId={userId} />;
      case "announcements":
        return <SupportDirectorAnnouncements userId={userId} />;
      case "messages":
        return <SupportDirectorMessages userId={userId} />;
      case "profile":
        return <SupportDirectorProfile userId={userId} />;
      case "settings":
        return <SupportDirectorSettings userId={userId} />;
      default:
        return <SupportDirectorDashboard userId={userId} />;
    }
  };

  const handleMenuClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar }
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Support Director</h1>
              <p className="text-xs text-gray-600">Management Panel</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Branch Info }
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <p className="font-medium">Branch Access</p>
            <p>All Branches</p>
          </div>
        </div>
      </div>

      {/* Main Content }
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header }
        {isMobile && (
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                <ClipboardCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Support Director</span>
            </div>
            <div className="w-10"></div>
          </div>
        )}

        {/* Content Area }
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Overlay }
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SupportDirectorPanel;

*/