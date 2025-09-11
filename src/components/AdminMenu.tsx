"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";

const adminMenuItems = [
  {
    title: "ADMIN MENU",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/admin",
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/admin/list/teachers",
      },
      {
        icon: "/assignment.png",
        label: "Teacher Assignments",
        href: "/admin/teacher-assignments",
      },
      {
        icon: "/student.png",
        label: "Students", 
        href: "/admin/list/students",
      },
      {
        icon: "/assignment.png",
        label: "Student Assignments",
        href: "/admin/student-assignments",
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/admin/list/parents",
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/admin/list/subjects",
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/admin/list/classes",
      },
      {
        icon: "/singleBranch.png",
        label: "Branches",
        href: "/admin/list/branches",
      },
      {
        icon: "/calendar.png",
        label: "Academic Years",
        href: "/admin/list/academic-years",
      },
      {
        icon: "/profile.png",
        label: "Users",
        href: "/admin/list/users",
      },
      {
        icon: "/lesson.png",
        label: "Timetables",
        href: "/admin/timetables",
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/admin/exams",
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/admin/list/announcements",
      },
      {
        icon: "/exam.png",
        label: "Gradebook",
        href: "/admin/gradebook",
      },
      {
        icon: "/profile.png",
        label: "Attendance",
        href: "/admin/attendance",
      },
      {
        icon: "/lesson.png",
        label: "Homework",
        href: "/admin/homework",
      },
      {
        icon: "/singleBranch.png",
        label: "Documents",
        href: "/admin/documents",
      },
      {
        icon: "/announcement.png",
        label: "Complaints",
        href: "/admin/complaints",
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/admin/list/events",
      },
      {
        icon: "/announcement.png",
        label: "Messages",
        href: "/admin/messages",
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/admin/profile",
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/admin/settings",
      },
    ],
  },
];

const AdminMenu = () => {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();

  return (
    <div className="mt-4 text-sm">
      {adminMenuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                onClick={() => navigateTo(item.href)}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight w-full text-left transition-all duration-200 ${
                  isActive ? "bg-lamaSkyLight text-blue-600" : ""
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

export default AdminMenu;
