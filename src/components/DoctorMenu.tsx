/*
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";
import { 
  Home, 
  ClipboardCheck, 
  Calendar, 
  CalendarDays, 
  Megaphone, 
  MessageSquare, 
  User, 
  Settings,
  Stethoscope
} from "lucide-react";

const items = [
  { icon: Home, label: "Dashboard", href: "/doctor", gradient: "from-green-500 to-emerald-600" },
  { icon: ClipboardCheck, label: "Meal Approvals", href: "/doctor/meal-approvals", gradient: "from-blue-500 to-indigo-600" },
  { icon: Calendar, label: "Meal Calendar", href: "/doctor/meal-calendar", gradient: "from-purple-500 to-violet-600" },
  { icon: CalendarDays, label: "Events", href: "/doctor/events", gradient: "from-orange-500 to-amber-600" },
  { icon: Megaphone, label: "Announcements", href: "/doctor/announcements", gradient: "from-red-500 to-rose-600" },
  { icon: MessageSquare, label: "Messages", href: "/doctor/messages", gradient: "from-teal-500 to-cyan-600" },
  { icon: User, label: "Profile", href: "/doctor/profile", gradient: "from-pink-500 to-rose-600" },
  { icon: Settings, label: "Settings", href: "/doctor/settings", gradient: "from-gray-500 to-slate-600" },
];

export default function DoctorMenu() {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();

  return (
    <div className="mt-6 space-y-2">
      <div className="flex items-center gap-2 px-4 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <span className="hidden lg:block text-gray-700 font-semibold text-sm tracking-wide">DOCTOR PANEL</span>
      </div>
      
      {items.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;
        return (
          <button
            onClick={() => navigateTo(item.href)}
            key={item.label}
            className={`group relative w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 mx-2 rounded-xl transition-all duration-300 hover:scale-105 ${
              isActive 
                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg animate-pulse` 
                : "text-gray-600 hover:bg-white/60 hover:shadow-md hover:text-gray-800"
            }`}
          >
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              isActive 
                ? "bg-white/20 shadow-inner" 
                : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
            }`}>
              <IconComponent className={`w-4 h-4 transition-colors duration-300 ${
                isActive ? "text-white" : "text-gray-600 group-hover:text-gray-800"
              }`} />
            </div>
            <span className={`hidden lg:block font-medium text-sm transition-colors duration-300 ${
              isActive ? "text-white" : "text-gray-700 group-hover:text-gray-900"
            }`}>
              {item.label}
            </span>
            {isActive && (
              <div className="hidden lg:block ml-auto">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
            <InlineGifLoader loading={false} className="ml-auto hidden lg:block" />
          </button>
        );
      })}
    </div>
  );
}

*/