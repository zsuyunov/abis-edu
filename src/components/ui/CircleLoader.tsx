"use client";

import { useEffect, useState } from "react";

// Beautiful Blue Circle Loader exactly like in the image
export const CircleLoader = ({ loading, size = "large" }: { loading: boolean; size?: "small" | "medium" | "large" }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Multiple rotating circles for the exact effect */}
      <div className="absolute inset-0 animate-spin">
        <div className="w-full h-full rounded-full bg-blue-500 opacity-100"></div>
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.1s', animationDirection: 'reverse' }}>
        <div className="w-full h-full rounded-full bg-blue-400 opacity-80"></div>
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.2s' }}>
        <div className="w-full h-full rounded-full bg-blue-600 opacity-60"></div>
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.3s', animationDirection: 'reverse' }}>
        <div className="w-full h-full rounded-full bg-blue-300 opacity-40"></div>
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.4s' }}>
        <div className="w-full h-full rounded-full bg-blue-700 opacity-20"></div>
      </div>
    </div>
  );
};

// Full screen circle loader overlay for navigation
export const FullScreenCircleLoader = ({ loading }: { loading: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="relative">
        {/* Large version with multiple circles like in the image */}
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 animate-spin duration-1000">
            <div className="w-full h-full rounded-full bg-blue-500 opacity-100"></div>
          </div>
          <div className="absolute inset-1 animate-spin duration-800" style={{ animationDirection: 'reverse' }}>
            <div className="w-full h-full rounded-full bg-blue-400 opacity-80"></div>
          </div>
          <div className="absolute inset-2 animate-spin duration-1200">
            <div className="w-full h-full rounded-full bg-blue-600 opacity-60"></div>
          </div>
          <div className="absolute inset-3 animate-spin duration-600" style={{ animationDirection: 'reverse' }}>
            <div className="w-full h-full rounded-full bg-blue-300 opacity-40"></div>
          </div>
          <div className="absolute inset-4 animate-spin duration-1400">
            <div className="w-full h-full rounded-full bg-blue-700 opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact circle loader for buttons and inline elements
export const InlineCircleLoader = ({ loading, className = "" }: { loading: boolean; className?: string }) => {
  if (!loading) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="w-4 h-4 relative">
        <div className="absolute inset-0 animate-spin duration-800">
          <div className="w-full h-full rounded-full bg-blue-500 opacity-100"></div>
        </div>
        <div className="absolute inset-0.5 animate-spin duration-600" style={{ animationDirection: 'reverse' }}>
          <div className="w-full h-full rounded-full bg-blue-400 opacity-70"></div>
        </div>
        <div className="absolute inset-1 animate-spin duration-1000">
          <div className="w-full h-full rounded-full bg-blue-600 opacity-40"></div>
        </div>
      </div>
    </div>
  );
};

// Navigation circle loader - appears at top of screen
export const NavigationCircleLoader = ({ loading }: { loading: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full p-3 shadow-lg border">
        <div className="w-8 h-8 relative">
          <div className="absolute inset-0 animate-spin duration-1000">
            <div className="w-full h-full rounded-full bg-blue-500 opacity-100"></div>
          </div>
          <div className="absolute inset-0.5 animate-spin duration-700" style={{ animationDirection: 'reverse' }}>
            <div className="w-full h-full rounded-full bg-blue-400 opacity-80"></div>
          </div>
          <div className="absolute inset-1 animate-spin duration-1300">
            <div className="w-full h-full rounded-full bg-blue-600 opacity-60"></div>
          </div>
          <div className="absolute inset-1.5 animate-spin duration-500" style={{ animationDirection: 'reverse' }}>
            <div className="w-full h-full rounded-full bg-blue-300 opacity-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleLoader;
