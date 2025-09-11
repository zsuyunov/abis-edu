/*
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";

const items = [
  { icon: "/home.png", label: "Dashboard", href: "/chief" },
  { icon: "/calendar.png", label: "Weekly Meal Plan", href: "/chief/meal-plan" },
  { icon: "/calendar.png", label: "Meal Calendar", href: "/chief/meal-calendar" },
  { icon: "/calendar.png", label: "Events", href: "/chief/events" },
  { icon: "/announcement.png", label: "Announcements", href: "/chief/announcements" },
  { icon: "/message.png", label: "Messages", href: "/chief/messages" },
  { icon: "/profile.png", label: "Profile", href: "/chief/profile" },
  { icon: "/setting.png", label: "Settings", href: "/chief/settings" },
];

export default function ChiefMenu() {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();

  return (
    <div className="mt-6 text-sm">
      <div className="hidden lg:block mb-6">
        <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          <span className="text-gray-700 font-bold text-xs uppercase tracking-wider">Chief Menu</span>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              onClick={() => navigateTo(item.href)}
              key={item.label}
              className={`group relative flex items-center justify-center lg:justify-start gap-4 py-3 px-4 rounded-2xl w-full text-left transition-all duration-300 hover:scale-[1.02] ${
                isActive 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25" 
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md"
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-white/20 backdrop-blur-sm" 
                  : "bg-white group-hover:bg-blue-100 group-hover:scale-110"
              }`}>
                <Image 
                  src={item.icon} 
                  alt="" 
                  width={18} 
                  height={18} 
                  className={`transition-all duration-300 ${
                    isActive ? "filter brightness-0 invert" : "group-hover:scale-110"
                  }`}
                />
              </div>
              <span className={`hidden lg:block font-medium transition-all duration-300 ${
                isActive ? "text-white" : "group-hover:font-semibold"
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
              <InlineGifLoader loading={false} className="ml-auto hidden lg:block" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

*/