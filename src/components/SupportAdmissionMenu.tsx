
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";

const supportAdmissionMenuItems = [
  {
    title: "SUPPORT ADMISSION MENU",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/support-admission",
      },
      {
        icon: "/student.png",
        label: "Students", 
        href: "/support-admission/students",
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/support-admission/parents",
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/support-admission/announcements",
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/support-admission/events",
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/support-admission/messages",
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/support-admission/profile",
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/support-admission/settings",
      },
    ],
  },
];

const SupportAdmissionMenu = () => {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();

  return (
    <div className="mt-4 text-sm">
      {supportAdmissionMenuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-purple-600 font-medium my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                onClick={() => navigateTo(item.href)}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 text-purple-700 py-2 md:px-2 rounded-md hover:bg-purple-50 w-full text-left transition-all duration-200 ${
                  isActive ? "bg-purple-100 text-purple-800 font-medium" : ""
                }`}
              >
                <Image src={item.icon} alt="" width={20} height={20} />
                <span className="hidden lg:block">{item.label}</span>
                <InlineGifLoader loading={false} className="ml-auto hidden lg:block" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SupportAdmissionMenu;


