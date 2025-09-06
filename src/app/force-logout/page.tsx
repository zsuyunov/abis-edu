"use client";

import { useEffect } from "react";

export default function ForceLogoutPage() {
  useEffect(() => {
    const clearEverything = async () => {
      try {
        // Step 1: Call server-side session clearing API
        await fetch("/api/clear-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.log("Server session clear failed:", error);
      }

      // Step 2: Client-side comprehensive clearing
      const allCookies = [
        "auth_token",
        "__session", 
        "__session_61dFzdSC",
        "__clerk_db_jwt",
        "__clerk_db_jwt_u6pPacZK", 
        "__clerk_db_jwt_TDWNA_Aa",
        "__clerk_db_jwt_61dFzdSC",
        "__client_uat",
        "__client_uat_61dFzdSC",
        "__client_uat_u6pPacZK",
        "__client_uat_TDWNA_Aa",
        "remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d",
        "csrftoken",
        "__stripe_mid",
        "stack-refresh-8a9dc9ac-3c3d-4530-a664-d4bf63eae1f4",
        "ajs_anonymous_id"
      ];
      
      // Clear each cookie in multiple ways
      allCookies.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      });
      
      // Clear all storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log("Storage clear error:", e);
      }
      
      // Step 3: Force multiple redirects to ensure clean state
      setTimeout(() => {
        window.location.replace("/login");
      }, 1000);
    };
    
    clearEverything();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-red-600">
            🚫 Force Logout
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Clearing all sessions and redirecting to login...
          </p>
          <div className="mt-4 animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-red-600 rounded-full" />
        </div>
      </div>
    </div>
  );
}
