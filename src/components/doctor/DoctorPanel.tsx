/*
"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Users, 
  Settings, 
  User, 
  MessageSquare, 
  Bell,
  Stethoscope,
  ClipboardCheck,
  BarChart3,
  Menu,
  X
} from "lucide-react";
import DoctorDashboard from "./DoctorDashboard";
import MealApprovals from "./MealApprovals";
import DoctorMealCalendar from "./DoctorMealCalendar";
import DoctorEvents from "./DoctorEvents";
import DoctorAnnouncements from "./DoctorAnnouncements";
import DoctorMessages from "./DoctorMessages";
import DoctorProfile from "./DoctorProfile";
import DoctorSettings from "./DoctorSettings";

type DoctorSection = 
  | "dashboard" 
  | "meal-approvals" 
  | "meal-calendar"
  | "events" 
  | "announcements" 
  | "messages" 
  | "profile" 
  | "settings";

interface DoctorPanelProps {
  userId: string;
}

const DoctorPanel = ({ userId }: DoctorPanelProps) => {
  const [activeSection, setActiveSection] = useState<DoctorSection>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    {
      id: "dashboard" as DoctorSection,
      label: "Dashboard",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "meal-approvals" as DoctorSection,
      label: "Meal Approvals",
      icon: ClipboardCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "meal-calendar" as DoctorSection,
      label: "Meal Calendar",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "events" as DoctorSection,
      label: "Events",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "announcements" as DoctorSection,
      label: "Announcements",
      icon: Bell,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      id: "messages" as DoctorSection,
      label: "Messages",
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "profile" as DoctorSection,
      label: "Profile",
      icon: User,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      id: "settings" as DoctorSection,
      label: "Settings",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DoctorDashboard userId={userId} />;
      case "meal-approvals":
        return <MealApprovals userId={userId} />;
      case "meal-calendar":
        return <DoctorMealCalendar userId={userId} />;
      case "events":
        return <DoctorEvents userId={userId} />;
      case "announcements":
        return <DoctorAnnouncements userId={userId} />;
      case "messages":
        return <DoctorMessages userId={userId} />;
      case "profile":
        return <DoctorProfile userId={userId} />;
      case "settings":
        return <DoctorSettings userId={userId} />;
      default:
        return <DoctorDashboard userId={userId} />;
    }
  };

  const activeItem = navigationItems.find(item => item.id === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Mobile Header }
      {isMobile && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Doctor Panel</h1>
                <p className="text-sm text-gray-600">{activeItem?.label}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar }
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
          ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
          w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 transition-transform duration-300 ease-in-out
        `}>
          {/* Desktop Header }
          {!isMobile && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-lg">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Doctor Panel</h1>
                  <p className="text-sm text-gray-600">Health & Nutrition Review</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation }
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? `${item.bgColor} ${item.color} shadow-md border-2 border-current/20` 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                  <span className={`font-medium ${isActive ? 'text-current' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Branch Info }
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Branch Access</span>
              </div>
              <p className="text-xs text-green-700">
                You can only approve meal plans for your assigned branch.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Overlay }
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content }
        <div className="flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPanel;

*/