"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Custom GIF Loader using your loader-beruniy.gif
export const CustomGifLoader = ({ loading, size = "large" }: { loading: boolean; size?: "small" | "medium" | "large" }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      // Keep loader visible longer to ensure page is fully loaded
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12", 
    large: "w-16 h-16"
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      <Image 
        src="/loader-beruniy.gif" 
        alt="Loading..." 
        width={size === "small" ? 32 : size === "medium" ? 48 : 64}
        height={size === "small" ? 32 : size === "medium" ? 48 : 64}
        className="object-contain"
        priority
        unoptimized // For GIF animation
      />
    </div>
  );
};

// Full screen GIF loader overlay for navigation
export const FullScreenGifLoader = ({ loading }: { loading: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      // Keep loader visible longer to ensure page is fully loaded
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="relative">
        <Image 
          src="/loader-beruniy.gif" 
          alt="Loading..." 
          width={80}
          height={80}
          className="object-contain"
          priority
          unoptimized // For GIF animation
        />
      </div>
    </div>
  );
};

// Compact GIF loader for buttons and inline elements
export const InlineGifLoader = ({ loading, className = "" }: { loading: boolean; className?: string }) => {
  if (!loading) return null;

  return (
    <div className={`relative ${className}`}>
      <Image 
        src="/loader-beruniy.gif" 
        alt="Loading..." 
        width={20}
        height={20}
        className="object-contain"
        priority
        unoptimized // For GIF animation
      />
    </div>
  );
};

// Navigation GIF loader - appears at top of screen
export const NavigationGifLoader = ({ loading }: { loading: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      // Keep loader visible longer to ensure page is fully loaded
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full p-3 shadow-lg border border-gray-200">
        <Image 
          src="/loader-beruniy.gif" 
          alt="Loading..." 
          width={32}
          height={32}
          className="object-contain"
          priority
          unoptimized // For GIF animation
        />
      </div>
    </div>
  );
};

export default CustomGifLoader;
