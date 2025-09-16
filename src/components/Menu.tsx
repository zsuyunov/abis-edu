"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/main-hr",
        visible: ["main_hr"],
      },
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/support-hr",
        visible: ["support_hr"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/main-hr/teachers",
        visible: ["main_hr"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/support-hr/teachers",
        visible: ["support_hr"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/singleBranch.png",
        label: "Branches",
        href: "/list/branches",
        visible: ["admin"],
      },
      {
        icon: "/calendar.png",
        label: "Academic Years",
        href: "/list/academic-years",
        visible: ["admin"],
      },
      {
        icon: "/profile.png",
        label: "Users",
        href: "/list/users",
        visible: ["admin"],
      },
      {
        icon: "/profile.png",
        label: "Users",
        href: "/main-hr/users",
        visible: ["main_hr"],
      },
      {
        icon: "/profile.png",
        label: "Users",
        href: "/support-hr/users",
        visible: ["support_hr"],
      },
      {
        icon: "/lesson.png",
        label: "Timetables",
        href: "/list/timetables",
        visible: ["admin"],
      },
                {
              icon: "/attendance.png",
              label: "Attendance",
              href: "/teacher/attendance",
              visible: ["teacher"],
            },
            {
              icon: "/assignment.png",
              label: "Homework",
              href: "/teacher/homework",
              visible: ["teacher"],
            },
            {
              icon: "/result.png",
              label: "Grades & Exams",
              href: "/teacher/gradebook",
              visible: ["teacher"],
            },
                  {
              icon: "/lesson.png",
              label: "My Timetable",
              href: "/student/timetables",
              visible: ["student"],
            },
            {
              icon: "/assignment.png",
              label: "My Homework",
              href: "/student/homework",
              visible: ["student"],
            },
            {
              icon: "/attendance.png",
              label: "My Attendance",
              href: "/student/attendance",
              visible: ["student"],
            },
            {
              icon: "/result.png",
              label: "My Grades & Exams",
              href: "/student/gradebook",
              visible: ["student"],
            },
            {
              icon: "/lesson.png",
              label: "Children's Timetables",
              href: "/parent/timetables",
              visible: ["parent"],
            },
            {
              icon: "/assignment.png",
              label: "Children's Homework",
              href: "/parent/homework",
              visible: ["parent"],
            },
            {
              icon: "/attendance.png",
              label: "Children's Attendance",
              href: "/parent/attendance",
              visible: ["parent"],
            },
            {
              icon: "/result.png",
              label: "Children's Grades & Exams",
              href: "/parent/gradebook",
              visible: ["parent"],
            },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/grade.png",
        label: "Gradebook",
        href: "/list/gradebook",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.png",
        label: "Admin Messages",
        href: "/admin/messages",
        visible: ["admin"],
      },
      {
        icon: "/complaint.png",
        label: "Complaints",
        href: "/admin/complaints",
        visible: ["admin"],
      },
      {
        icon: "/document.png",
        label: "Documents",
        href: "/admin/documents",
        visible: ["admin"],
      },
      {
        icon: "/homework.png",
        label: "Homework",
        href: "/admin/homework",
        visible: ["admin"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/admin/exams",
        visible: ["admin"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/main-hr/announcements",
        visible: ["main_hr"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/support-hr/announcements",
        visible: ["support_hr"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/main-hr/events",
        visible: ["main_hr"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/support-hr/events",
        visible: ["support_hr"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/main-hr/messages",
        visible: ["main_hr"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/support-hr/messages",
        visible: ["support_hr"],
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
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/main-hr/profile",
        visible: ["main_hr"],
      },
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/support-hr/profile",
        visible: ["support_hr"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/main-hr/settings",
        visible: ["main_hr"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/support-hr/settings",
        visible: ["support_hr"],
      },
    ],
  },
];

interface MenuProps {
  userRole?: string;
}

const Menu = ({ userRole }: MenuProps = {}) => {
  const [role, setRole] = useState<string>(userRole || '');
  const pathname = usePathname();

  // Detect user role from pathname and API
  useEffect(() => {
    if (userRole) {
      setRole(userRole);
      return;
    }

    const detectRole = async () => {
      try {
        // First try to get role from API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role) {
            setRole(data.user.role);
            return;
          }
        }
      } catch (error) {
        console.log('Could not fetch user role from API');
      }

      // Fallback: detect from pathname
      if (pathname.startsWith('/admin')) {
        setRole('admin');
      } else if (pathname.startsWith('/teacher')) {
        setRole('teacher');
      } else if (pathname.startsWith('/student')) {
        setRole('student');
      } else if (pathname.startsWith('/parent')) {
        setRole('parent');
      } else if (pathname.startsWith('/main-hr')) {
        setRole('main_hr');
      } else if (pathname.startsWith('/support-hr')) {
        setRole('support_hr');
      } else {
        setRole('admin'); // Default fallback
      }
    };

    detectRole();
  }, [pathname, userRole]);

  const getSectionColor = (href: string) => {
    if (href.includes("/branches")) {
      return "text-green-600 bg-green-100";
    }
    if (href.includes("/users")) {
      return "text-blue-600 bg-blue-100";
    }
    if (href.includes("/teachers")) {
      return "text-purple-600 bg-purple-100";
    }
    if (href.includes("/students")) {
      return "text-orange-600 bg-orange-100";
    }
    if (href.includes("/timetables")) {
      return "text-indigo-600 bg-indigo-100";
    }
    if (href.includes("/teacher/timetables")) {
      return "text-indigo-600 bg-indigo-100";
    }
      if (href.includes("/student/timetables")) {
    return "text-indigo-600 bg-indigo-100";
  }
  if (href.includes("/parent/timetables")) {
    return "text-indigo-600 bg-indigo-100";
  }
      if (href.includes("/teacher/attendance")) {
      return "text-orange-600 bg-orange-100";
    }
    if (href.includes("/teacher/homework")) {
      return "text-purple-600 bg-purple-100";
    }
    if (href.includes("/teacher/gradebook")) {
      return "text-green-600 bg-green-100";
    }
  if (href.includes("/student/homework")) {
    return "text-purple-600 bg-purple-100";
  }
  if (href.includes("/student/attendance")) {
    return "text-orange-600 bg-orange-100";
  }
  if (href.includes("/student/gradebook")) {
    return "text-green-600 bg-green-100";
  }
  if (href.includes("/parent/homework")) {
    return "text-purple-600 bg-purple-100";
  }
  if (href.includes("/parent/attendance")) {
    return "text-orange-600 bg-orange-100";
  }
  if (href.includes("/parent/gradebook")) {
    return "text-green-600 bg-green-100";
  }
    if (href.includes("/exams")) {
      return "text-red-600 bg-red-100";
    }
    if (href.includes("/subjects")) {
      return "text-teal-600 bg-teal-100";
    }
    if (href.includes("/classes")) {
      return "text-yellow-600 bg-yellow-100";
    }
    if (href.includes("/academic-years")) {
      return "text-indigo-600 bg-indigo-100";
    }
    if (href.includes("/events")) {
      return "text-pink-600 bg-pink-100";
    }
    if (href.includes("/announcements")) {
      return "text-cyan-600 bg-cyan-100";
    }
    if (href === "/" || href.includes("/home")) {
      return "text-blue-800 bg-blue-200";
    }
    if (href.includes("/parents")) {
      return "text-pink-600 bg-pink-100";
    }
    if (href.includes("/assignments")) {
      return "text-violet-600 bg-violet-100";
    }
    if (href.includes("/results")) {
      return "text-emerald-600 bg-emerald-100";
    }
    if (href.includes("/attendance")) {
      return "text-cyan-600 bg-cyan-100";
    }
    if (href.includes("/events")) {
      return "text-rose-600 bg-rose-100";
    }
    if (href.includes("/messages")) {
      return "text-sky-600 bg-sky-100";
    }
    if (href.includes("/admin/messages")) {
      return "text-purple-600 bg-purple-100";
    }
    if (href.includes("/announcements")) {
      return "text-amber-600 bg-amber-100";
    }
    if (href.includes("/profile")) {
      return "text-slate-600 bg-slate-100";
    }
    if (href.includes("/settings")) {
      return "text-gray-600 bg-gray-100";
    }
    return "text-gray-500";
  };

  const isActiveSection = (href: string) => {
    return pathname.includes(href.replace("/list", ""));
  };

  // Get user role from API on client side
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role) {
            setRole(data.user.role);
          }
        }
      } catch (error) {
        console.log('Could not fetch user role, using default');
      }
    };

    getUserRole();
  }, []);

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              const isActive = isActiveSection(item.href);
              const sectionColors = isActive ? getSectionColor(item.href) : "text-gray-500";
              
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight ${
                    isActive ? sectionColors : "text-gray-500"
                  }`}
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
