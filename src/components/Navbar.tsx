"use client";

import Image from "next/image";
import { usePowerUser, usePowerLogout } from "@/hooks/usePowerfulApi";
import { NavLoader, PowerButton } from "@/components/ui/PowerLoader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { data: userData, isLoading: loading } = usePowerUser();
  const logoutMutation = usePowerLogout();
  
  // Safe language hook usage with fallback
  let t: (key: string) => string;
  try {
    const languageContext = useLanguage();
    t = languageContext.t;
  } catch (error) {
    // Fallback for admin panel without LanguageProvider
    t = (key: string) => {
      const fallbackTranslations: Record<string, string> = {
        'nav.search': 'Search...',
        'common.loading': 'Loading...',
        'nav.logout': 'Logout'
      };
      return fallbackTranslations[key] || key;
    };
  }
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by waiting for client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Extract user data with instant fallback - ensure consistent server/client rendering
  const user = userData?.user || {
    id: 'admin',
    phone: '+998901234500',
    role: 'admin', // Fixed: consistent with fallbackUser
    name: 'Admin',
    surname: 'User'
  };

  // Format role display
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'main_director':
        return 'Main Director';
      case 'support_director':
        return 'Support Director';
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Teacher';
      case 'student':
        return 'Student';
      case 'parent':
        return 'Parent';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center justify-end gap-2 p-2">
      {/* Logout Button - Small and Mobile-friendly */}
      <PowerButton
        onClick={handleLogout}
        loading={logoutMutation.isPending}
        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm"
      >
        {logoutMutation.isPending ? t('common.loading') : t('nav.logout')}
      </PowerButton>
    </div>
  );
};

export default Navbar;
