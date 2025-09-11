"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const TeacherMenu = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const teacherMenuItems = [
    {
      title: "TEACHER MENU",
      items: [
        {
          icon: "/home.png",
          label: t('nav.dashboard'),
          href: "/teacher",
        },
        {
          icon: "/attendance.png",
          label: t('nav.attendance'),
          href: "/teacher/attendance",
        },
        {
          icon: "/homework.png",
          label: t('nav.homework'),
          href: "/teacher/homework",
        },
        {
          icon: "/grade.png",
          label: t('nav.gradebook'),
          href: "/teacher/gradebook",
        },
      ],
    },
  ];

  return (
    <div className="mt-2 text-xs sm:text-sm">
      {teacherMenuItems.map((i) => (
        <div className="flex flex-col gap-1" key={i.title}>
          <span className="hidden md:block text-gray-500 font-medium text-xs uppercase tracking-wide my-2 px-1">
            {t(i.title.toLowerCase().replace(' ', '_'))}
          </span>
          {i.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 text-gray-600 py-2 px-1 md:px-3 rounded-lg transition-all duration-200 hover:bg-green-100 hover:text-green-700 ${
                  isActive ? "bg-green-200 text-green-800 shadow-sm" : ""
                }`}
              >
                <Image src={item.icon} alt="" width={16} height={16} className="sm:w-5 sm:h-5" />
                <span className="hidden md:block text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default TeacherMenu;
