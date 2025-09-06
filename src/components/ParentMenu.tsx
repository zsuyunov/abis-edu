"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const parentMenuItems = [
  {
    title: "PARENT MENU",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/parent",
      },
      {
        icon: "/lesson.png",
        label: "Children's Schedule",
        href: "/parent/timetables",
      },
      {
        icon: "/homework.png",
        label: "Homework",
        href: "/parent/homework",
      },
      {
        icon: "/grade.png",
        label: "Children's Grades",
        href: "/parent/gradebook",
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/parent/attendance",
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/parent/exams",
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/parent/results",
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
      },
    ],
  },
];

const ParentMenu = () => {
  const pathname = usePathname();

  return (
    <div className="mt-4 text-sm">
      {parentMenuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight ${
                  isActive ? "bg-lamaSkyLight text-blue-600" : ""
                }`}
              >
                <Image src={item.icon} alt="" width={20} height={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ParentMenu;
