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
    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-white/90 via-blue-50/80 to-indigo-100/90 backdrop-blur-sm border-b border-white/20 shadow-lg">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/30 px-4 py-2 hover:shadow-lg transition-all duration-300">
        <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <Image src="/search.png" alt="" width={16} height={16} className="filter brightness-0 invert" />
        </div>
        <input
          type="text"
          placeholder={t('nav.search')}
          className="w-[250px] p-2 bg-transparent outline-none text-gray-700 placeholder-gray-500 font-medium"
        />
      </div>
      
      {/* ICONS AND USER */}
      <div className="flex items-center gap-4 justify-end w-full">
        
        {/* User Info */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-md border border-white/30 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col text-right">
            {!isHydrated || loading ? (
              <NavLoader />
            ) : (
              <>
                <span className="text-sm font-bold text-gray-800 transition-all duration-200">
                  {user?.name} {user?.surname}
                </span>
                <span className="text-xs text-gray-600 font-medium transition-all duration-200">
                  {getRoleDisplay(user?.role)}
                </span>
              </>
            )}
          </div>
          
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">
              {!isHydrated || loading ? 'A' : (user?.name?.charAt(0) || 'A') + (user?.surname?.charAt(0) || 'U')}
            </span>
          </div>
        </div>
        
        {/* Logout Button */}
        <PowerButton
          onClick={handleLogout}
          loading={logoutMutation.isPending}
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-red-400/30"
        >
          {logoutMutation.isPending ? t('common.loading') : t('nav.logout')}
        </PowerButton>
      </div>
    </div>
  );
};

export default Navbar;
