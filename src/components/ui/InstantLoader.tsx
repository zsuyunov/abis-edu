"use client";

import { useEffect, useState } from "react";

interface InstantLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "pulse" | "dots";
}

export const InstantLoader = ({ 
  className = "", 
  size = "md", 
  variant = "spinner" 
}: InstantLoaderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-6 h-6"
  };

  if (variant === "spinner") {
    return (
      <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin ${className}`}></div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded animate-pulse ${className}`}></div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  return null;
};

// Skeleton text loader
export const SkeletonText = ({ 
  lines = 1, 
  className = "",
  width = "w-full"
}: { 
  lines?: number; 
  className?: string;
  width?: string;
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 rounded animate-pulse ${
            i === lines - 1 && lines > 1 ? 'w-3/4' : width
          }`}
        ></div>
      ))}
    </div>
  );
};

// Fast skeleton for navbar user info
export const NavbarUserSkeleton = () => {
  return (
    <div className="flex flex-col space-y-1">
      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-2 w-12 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
};

// Super fast mini loader for buttons
export const ButtonLoader = ({ size = "sm" }: { size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  
  return (
    <div className={`${sizeClass} border border-white border-t-transparent rounded-full animate-spin`}></div>
  );
};

export default InstantLoader;
