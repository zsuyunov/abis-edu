"use client";

import { useEffect, useState } from "react";

// Ultra fast page loader with smooth animations
export const PageLoader = ({ loading = true }: { loading?: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 50);

      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [loading]);

  if (!loading && progress >= 100) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
};

// Smooth content loader
export const ContentLoader = ({ 
  loading = true,
  children,
  skeletonRows = 3 
}: { 
  loading?: boolean;
  children: React.ReactNode;
  skeletonRows?: number;
}) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

// Fast card loader
export const CardLoader = ({ loading = true, children }: { loading?: boolean; children: React.ReactNode }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
      {children}
    </div>
  );
};

// Ultra fast table loader
export const TableLoader = ({ 
  loading = true, 
  rows = 5, 
  cols = 4,
  children 
}: { 
  loading?: boolean; 
  rows?: number; 
  cols?: number;
  children: React.ReactNode;
}) => {
  if (loading) {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="flex space-x-4 mb-4 bg-gray-50 p-4 rounded-t-lg">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        
        {/* Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={rowIndex} 
              className="flex space-x-4 p-4 border-b border-gray-100"
              style={{ animationDelay: `${rowIndex * 100}ms` }}
            >
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-6 bg-gray-200 rounded animate-pulse ${
                    colIndex === 0 ? 'w-32' : 
                    colIndex === 1 ? 'w-24' : 
                    colIndex === 2 ? 'w-20' : 'w-16'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

// Instant button loader
export const ButtonLoader = ({ 
  loading = false, 
  children, 
  className = "",
  ...props 
}: { 
  loading?: boolean; 
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <button 
      {...props}
      disabled={loading || props.disabled}
      className={`relative transition-all duration-200 ${
        loading ? 'cursor-not-allowed opacity-70' : 'hover:scale-105'
      } ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// Smooth navbar loader
export const NavbarLoader = () => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex flex-col space-y-1">
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-2 w-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

// Add global fade-in animation to CSS
const globalStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}

export default PageLoader;
