"use client";

import Image from "next/image";
import { usePowerUser, usePowerLogout } from "@/hooks/usePowerfulApi";
import { NavLoader, PowerButton } from "@/components/ui/PowerLoader";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { data: userData, isLoading: loading } = usePowerUser();
  const logoutMutation = usePowerLogout();
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
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div>
        <div className="flex flex-col">
          {!isHydrated || loading ? (
            <NavLoader />
          ) : (
            <>
              <span className="text-xs leading-3 font-medium transition-all duration-200">
                {user?.name} {user?.surname}
              </span>
              <span className="text-[10px] text-gray-500 text-right transition-all duration-200">
                {getRoleDisplay(user?.role)}
              </span>
            </>
          )}
        </div>
        
        <PowerButton
          onClick={handleLogout}
          loading={logoutMutation.isPending}
          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </PowerButton>
      </div>
    </div>
  );
};

export default Navbar;
