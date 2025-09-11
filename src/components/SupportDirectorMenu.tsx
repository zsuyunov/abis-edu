/*
"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";

const items = [
  { icon: "/home.png", label: "Dashboard", href: "/support-director" },
  { icon: "/teacher.png", label: "Teachers", href: "/support-director/list/teachers" },
  { icon: "/assignment.png", label: "Teacher Assignments", href: "/support-director/teacher-assignments" },
  { icon: "/student.png", label: "Students", href: "/support-director/list/students" },
  { icon: "/parent.png", label: "Parents", href: "/support-director/list/parents" },
  { icon: "/subject.png", label: "Subjects", href: "/support-director/list/subjects" },
  { icon: "/class.png", label: "Classes", href: "/support-director/list/classes" },
  { icon: "/calendar.png", label: "Academic Years", href: "/support-director/list/academic-years" },
  { icon: "/profile.png", label: "Users", href: "/support-director/list/users" },
  { icon: "/lesson.png", label: "Timetables", href: "/support-director/list/timetables" },
  { icon: "/exam.png", label: "Exams", href: "/support-director/exams" },
  { icon: "/announcement.png", label: "Announcements", href: "/support-director/list/announcements" },
  { icon: "/exam.png", label: "Gradebook", href: "/support-director/gradebook" },
  { icon: "/profile.png", label: "Attendance", href: "/support-director/attendance" },
  { icon: "/lesson.png", label: "Homework", href: "/support-director/homework" },
  { icon: "/singleBranch.png", label: "Documents", href: "/support-director/documents" },
  { icon: "/announcement.png", label: "Complaints", href: "/support-director/complaints" },
  { icon: "/calendar.png", label: "Events", href: "/support-director/events" },
  { icon: "/maleFemale.png", label: "Meal Approvals", href: "/support-director/meal-approvals" },
  { icon: "/calendar.png", label: "Meal Calendar", href: "/support-director/meal-calendar" },
  { icon: "/announcement.png", label: "Messages", href: "/support-director/messages" },
  { icon: "/profile.png", label: "Profile", href: "/support-director/profile" },
  { icon: "/setting.png", label: "Settings", href: "/support-director/settings" },
];

export default function SupportDirectorMenu() {
  const pathname = usePathname();
  const { navigateTo } = useNavigation();

  return (
    <div className="mt-4 text-sm">
      <span className="hidden lg:block text-gray-500 font-light my-4">SUPPORT DIRECTOR MENU</span>
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


*/