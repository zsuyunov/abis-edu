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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to user's role dashboard with hyphenated paths for HR and Admission roles
        const role: string = data.user.role;
        const roleRouteMap: Record<string, string> = {
          main_hr: "/main-hr",
          support_hr: "/support-hr",
          main_admission: "/main-admission",
          support_admission: "/support-admission"
        }
        const target = roleRouteMap[role] || `/${role}`;
        router.push(target);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
          
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-purple-500" />
                <span>Phone Number</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+998901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                />
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-500" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 transform ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-500 to-red-500 hover:from-purple-600 hover:to-red-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              }`}
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
          </form>
          
          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
              <GraduationCap className="w-3 h-3" />
              <span>Secure School Management System</span>
            </p>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-400 to-purple-400 rounded-full opacity-10 blur-2xl"></div>
      </div>
    </div>
  );
}

export default LoginPage;
