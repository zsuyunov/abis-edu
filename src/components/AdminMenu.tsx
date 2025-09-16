"use client";

import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { InlineGifLoader } from "@/components/ui/CustomGifLoader";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
  UsersRound,
  BookOpen,
  School,
  Building2,
  Calendar,
  UserCog,
  Clock,
  FileText,
  Megaphone,
  BarChart3,
  UserCheck2,
  Notebook,
  FolderOpen,
  MessageSquare,
  CalendarDays,
  Mail,
  User,
  Settings
} from "lucide-react";

const adminMenuItems = [
  {
    title: "ADMIN MENU",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/admin",
      },
      {
        icon: Users,
        label: "Teachers",
        href: "/admin/list/teachers",
      },
      {
        icon: UserCheck,
        label: "Teacher Assignments",
        href: "/admin/teacher-assignments",
      },
      {
        icon: GraduationCap,
        label: "Students", 
        href: "/admin/list/students",
      },
      {
        icon: ClipboardList,
        label: "Student Assignments",
        href: "/admin/student-assignments",
      },
      {
        icon: UsersRound,
        label: "Parents",
        href: "/admin/list/parents",
      },
      {
        icon: BookOpen,
        label: "Subjects",
        href: "/admin/list/subjects",
      },
      {
        icon: School,
        label: "Classes",
        href: "/admin/list/classes",
      },
      {
        icon: Building2,
        label: "Branches",
        href: "/admin/list/branches",
      },
      {
        icon: Calendar,
        label: "Academic Years",
        href: "/admin/list/academic-years",
      },
      {
        icon: UserCog,
        label: "Users",
        href: "/admin/list/users",
      },
      {
        icon: Clock,
        label: "Timetables",
        href: "/admin/timetables",
      },
      {
        icon: FileText,
        label: "Exams",
        href: "/admin/exams",
      },
      {
        icon: Megaphone,
        label: "Announcements",
        href: "/admin/list/announcements",
      },
      {
        icon: BarChart3,
        label: "Gradebook",
        href: "/admin/gradebook",
      },
      {
        icon: UserCheck2,
        label: "Attendance",
        href: "/admin/attendance",
      },
      {
        icon: Notebook,
        label: "Homework",
        href: "/admin/homework",
      },
      {
        icon: FolderOpen,
        label: "Documents",
        href: "/admin/documents",
      },
      {
        icon: MessageSquare,
        label: "Complaints",
        href: "/admin/complaints",
      },
      {
        icon: CalendarDays,
        label: "Events",
        href: "/admin/list/events",
      },
      {
        icon: Mail,
        label: "Messages",
        href: "/admin/messages",
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: User,
        label: "Profile",
        href: "/admin/profile",
      },
      {
        icon: Settings,
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
    <div className="flex-1">
      <div className="text-sm h-full p-2 space-y-6">
        {adminMenuItems.map((i) => (
          <div className="flex flex-col gap-1 mb-6" key={i.title}>
            <span className="hidden lg:block text-gray-400 font-medium text-xs uppercase tracking-wider mb-2 px-2">
              {i.title}
            </span>
            <div className="space-y-1">
              {i.items.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <button
                    onClick={() => navigateTo(item.href)}
                    key={item.label}
                    className={`flex items-center justify-center lg:justify-start gap-3 py-2.5 px-2 rounded-lg w-full text-left transition-all duration-200 ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <IconComponent size={18} className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                    <span className="hidden lg:block text-sm font-normal">{item.label}</span>
                    <InlineGifLoader loading={false} className="ml-auto hidden lg:block" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMenu;
