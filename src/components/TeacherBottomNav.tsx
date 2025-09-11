"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { 
  Home, 
  Users, 
  BookOpen, 
  BarChart3
} from "lucide-react";

const TeacherBottomNav = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      icon: Home,
      label: t('nav.dashboard'),
      href: "/teacher",
      id: "dashboard"
    },
    {
      icon: Users,
      label: t('nav.attendance'),
      href: "/teacher/attendance",
      id: "attendance"
    },
    {
      icon: BookOpen,
      label: t('nav.homework'),
      href: "/teacher/homework",
      id: "homework"
    },
    {
      icon: BarChart3,
      label: t('nav.gradebook'),
      href: "/teacher/gradebook",
      id: "gradebook"
    },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg"
    >
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/teacher" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex flex-col items-center justify-center p-2 min-w-[60px]"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex flex-col items-center justify-center transition-all duration-200 ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  {/* Icon with background */}
                  <div className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </motion.div>
  );
};

export default TeacherBottomNav;
