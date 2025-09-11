"use client";

import { useEffect, useState } from "react";

// Ultra-visible global loader
export const GlobalPowerLoader = ({ loading }: { loading: boolean }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setVisible(true);
      setProgress(0);
      
      // Super fast progress animation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 25;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setVisible(false), 300);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      {/* Main loader container */}
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        {/* Animated logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">ABIS</h3>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Loading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Spinning loader */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animate-reverse"></div>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-4">
          Optimizing for best performance...
        </p>
      </div>
    </div>
  );
};

// Instant page transition loader
export const PageTransitionLoader = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
      <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
    </div>
  );
};

// Ultra-fast table loader with visible animations
export const PowerTableLoader = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header with shimmer */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex space-x-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div 
              key={i} 
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
              style={{ 
                width: i === 0 ? '120px' : i === 1 ? '100px' : '80px',
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Rows with staggered animation */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="p-4 border-b border-gray-100"
          style={{ animationDelay: `${rowIndex * 80}ms` }}
        >
          <div className="flex space-x-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={colIndex}
                className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                style={{ 
                  width: colIndex === 0 ? '120px' : colIndex === 1 ? '100px' : '80px',
                  animationDelay: `${(rowIndex * cols + colIndex) * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Powerful card loader with shimmer effect
export const PowerCardLoader = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"></div>
          </div>
          
          {/* Main content */}
          <div className="h-8 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
};

// Button with instant feedback
export const PowerButton = ({ 
  loading, 
  children, 
  onClick, 
  className = "",
  ...props 
}: {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);
    onClick?.();
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={loading}
      className={`
        relative transition-all duration-150 transform
        ${clicked ? 'scale-95' : 'scale-100'}
        ${loading ? 'cursor-not-allowed opacity-80' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={`transition-opacity duration-150 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
};

// Navigation loader
export const NavLoader = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col space-y-1">
        <div className="h-3 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
        <div className="h-2 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export default GlobalPowerLoader;
