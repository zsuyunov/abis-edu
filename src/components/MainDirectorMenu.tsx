/*
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";

const mainDirectorMenuItems = [
  {
    title: "MAIN DIRECTOR MENU",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/main-director",
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/main-director/list/teachers",
      },
      {
        icon: "/assignment.png",
        label: "Teacher Assignments",
        href: "/main-director/teacher-assignments",
      },
      {
        icon: "/student.png",
        label: "Students", 
        href: "/main-director/list/students",
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/main-director/list/parents",
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/main-director/list/subjects",
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/main-director/list/classes",
      },
      {
        icon: "/singleBranch.png",
        label: "Branches",
        href: "/main-director/list/branches",
      },
      {
        icon: "/calendar.png",
        label: "Academic Years",
        href: "/main-director/list/academic-years",
      },
      {
        icon: "/profile.png",
        label: "Users",
        href: "/main-director/list/users",
      },
      {
        icon: "/lesson.png",
        label: "Timetables",
        href: "/main-director/list/timetables",
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/main-director/exams",
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/main-director/list/announcements",
      },
      {
        icon: "/exam.png",
        label: "Gradebook",
        href: "/main-director/gradebook",
      },
      {
        icon: "/profile.png",
        label: "Attendance",
        href: "/main-director/attendance",
      },
      {
        icon: "/lesson.png",
        label: "Homework",
        href: "/main-director/homework",
      },
      {
        icon: "/singleBranch.png",
        label: "Documents",
        href: "/main-director/documents",
      },
      {
        icon: "/announcement.png",
        label: "Complaints",
        href: "/main-director/complaints",
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/main-director/events",
      },
      {
        icon: "/announcement.png",
        label: "Messages",
        href: "/main-director/messages",
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/main-director/profile",
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/main-director/settings",
      },
    ],
  },
];

const MainDirectorMenu = () => {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();

  return (
    <div className="mt-4 text-sm">
      {mainDirectorMenuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-500 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                onClick={() => navigateTo(item.href)}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 text-gray-700 py-2 md:px-2 rounded-md hover:bg-gray-100 w-full text-left transition-all duration-200 ${
                  isActive ? "bg-gray-100 text-gray-900" : ""
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

export default MainDirectorMenu;

*/