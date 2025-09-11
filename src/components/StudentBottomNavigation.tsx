"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  User,
  Settings
} from "lucide-react";

const StudentBottomNavigation = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navigationItems = [
    {
      icon: Home,
      label: t('nav.dashboard'),
      href: "/student",
      color: "text-blue-500",
      activeColor: "text-blue-600",
    },
    {
      icon: BookOpen,
      label: t('nav.homework'),
      href: "/student/homework",
      color: "text-purple-500",
      activeColor: "text-purple-600",
    },
    {
      icon: GraduationCap,
      label: t('student.myGrades'),
      href: "/student/gradebook",
      color: "text-green-500",
      activeColor: "text-green-600",
    },
    {
      icon: Calendar,
      label: t('nav.attendance'),
      href: "/student/attendance",
      color: "text-orange-500",
      activeColor: "text-orange-600",
    },
    {
      icon: User,
      label: t('nav.profile'),
      href: "/profile",
      color: "text-indigo-500",
      activeColor: "text-indigo-600",
    },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg"
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center p-2 min-w-[60px]"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive ? 'transform -translate-y-1' : ''
                }`}
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Icon */}
                <div className="relative z-10">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? item.activeColor : item.color
                    }`}
                  />
                </div>
                
                {/* Label */}
                <span 
                  className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 w-1 h-1 bg-blue-500 rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </motion.div>
  );
};

export default StudentBottomNavigation;
