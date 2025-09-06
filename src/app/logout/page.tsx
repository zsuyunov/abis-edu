"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call the logout API to clear server-side cookies
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Logout API error:", error);
      }

      // Clear all authentication-related cookies client-side
      const cookiesToClear = [
        "auth_token",
        "__session", 
        "__session_61dFzdSC",
        "__clerk_db_jwt",
        "__clerk_db_jwt_u6pPacZK",
        "__clerk_db_jwt_TDWNA_Aa", 
        "__clerk_db_jwt_61dFzdSC"
      ];
      
      cookiesToClear.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
      });
      
      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login page
      router.push("/login");
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Logging out...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we log you out safely.
          </p>
        </div>
      </div>
    </div>
  );
}
