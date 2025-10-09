"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Eye, EyeOff, Phone, Lock, GraduationCap } from "lucide-react";
import Image from "next/image";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Clear any existing auth tokens on page load
  React.useEffect(() => {
    // Check for error parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'unsupported_role') {
      setError('Your user role is not supported. Please contact administrator.');
    }
    
    // Clean URL if it has query parameters (from accidental GET submission)
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Clear all authentication-related cookies
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
    
    // Also clear from localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting login...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
        credentials: "include", // Important for cookies
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (response.ok) {
        console.log("✅ Login successful, redirecting...");
        // Redirect to user's role dashboard with hyphenated paths for HR and Admission roles
        const role: string = data.user.role;
        const roleRouteMap: Record<string, string> = {
          main_hr: "/main-hr",
          support_hr: "/support-hr",
          main_admission: "/main-admission",
          support_admission: "/support-admission"
        }
        const target = roleRouteMap[role] || `/${role}`;
        console.log("🎯 Redirecting to:", target);
        router.push(target);
      } else {
        console.error("❌ Login failed:", data.error);
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const togglePassword = () => {
    console.log("👁️ Toggling password visibility");
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 space-y-8">
          
          {/* Header Section */}
          <div className="text-center space-y-4">
            {/* Beruniy Logo */}
            <div className="mx-auto w-40 h-40 flex items-center justify-center my-8">
              {!imageError ? (
                <Image 
                  src="/beruniy-logo-remove-bg.png" 
                  alt="Beruniy Logo" 
                  width={160} 
                  height={160}
                  className="object-contain"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-40 h-40 bg-gradient-to-br from-purple-500 to-red-500 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-20 h-20 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}
          
          {/* Login Form */}
          <div className="space-y-6">
            {/* Phone Number Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-purple-500" />
                <span>Phone Number</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="text"
                  placeholder="+998901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  className="w-full px-4 py-3 pl-12 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  style={{ color: '#111827' }}
                  autoComplete="off"
                />
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-500" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  style={{ color: '#111827' }}
                  autoComplete="off"
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" style={{ zIndex: 1 }} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePassword();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200 cursor-pointer z-20"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 pointer-events-none" />
                  ) : (
                    <Eye className="w-5 h-5 pointer-events-none" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any);
              }}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-purple-500 to-red-500 hover:from-purple-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
          
          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
              <GraduationCap className="w-3 h-3" />
              <span>Secure School Management System</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
