"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const StudentMenu = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const studentMenuItems = [
    {
      title: "STUDENT MENU",
      items: [
        {
          icon: "/home.png",
          label: t('nav.dashboard'),
          href: "/student",
        },
        {
          icon: "/homework.png",
          label: t('nav.homework'),
          href: "/student/homework",
        },
        {
          icon: "/grade.png",
          label: t('student.myGrades'),
          href: "/student/gradebook",
        },
        {
          icon: "/attendance.png",
          label: t('nav.attendance'),
          href: "/student/attendance",
        },
      ],
    },
    {
      title: "OTHER",
      items: [
        {
          icon: "/profile.png",
          label: t('nav.profile'),
          href: "/profile",
        },
        {
          icon: "/setting.png",
          label: t('nav.settings'),
          href: "/settings",
        },
      ],
    },
  ];

  return (
    <div className="mt-4 text-sm">
      {studentMenuItems.map((i) => (
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

export default StudentMenu;
