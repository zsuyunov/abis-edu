"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const teacherMenuItems = [
  {
    title: "TEACHER MENU",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/teacher",
      },
      {
        icon: "/lesson.png",
        label: "My Timetables",
        href: "/teacher/timetables",
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/teacher/attendance",
      },
      {
        icon: "/homework.png",
        label: "Homework",
        href: "/teacher/homework",
      },
      {
        icon: "/grade.png",
        label: "Gradebook",
        href: "/teacher/gradebook",
      },
      {
        icon: "/student.png",
        label: "My Students",
        href: "/teacher/students",
      },
      {
        icon: "/class.png",
        label: "My Classes",
        href: "/teacher/classes",
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/teacher/exams",
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

const TeacherMenu = () => {
  const pathname = usePathname();

  return (
    <div className="mt-4 text-sm">
      {teacherMenuItems.map((i) => (
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

export default TeacherMenu;
