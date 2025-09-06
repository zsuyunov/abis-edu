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
    <div className="mt-4 text-sm">
      <span className="hidden lg:block text-gray-500 font-light my-4">CHIEF MENU</span>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <button
            onClick={() => navigateTo(item.href)}
            key={item.label}
            className={`flex items-center justify-center lg:justify-start gap-4 text-gray-700 py-2 md:px-2 rounded-md hover:bg-gray-100 w-full text-left transition-all duration-200 ${isActive ? "bg-gray-100 text-gray-900" : ""}`}
          >
            <Image src={item.icon} alt="" width={20} height={20} />
            <span className="hidden lg:block">{item.label}</span>
            <InlineGifLoader loading={false} className="ml-auto hidden lg:block" />
          </button>
        );
      })}
    </div>
  );
}
