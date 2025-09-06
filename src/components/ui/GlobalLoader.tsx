"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
    if (!loading) {
      setLoadingMessage("Loading...");
    }
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, setLoading, loadingMessage, setLoadingMessage }}
    >
      {children}
      {isLoading && <GlobalLoader message={loadingMessage} />}
    </LoadingContext.Provider>
  );
};

interface GlobalLoaderProps {
  message?: string;
}

const GlobalLoader = ({ message = "Loading..." }: GlobalLoaderProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
        {/* Modern Spinner */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-blue-300 animate-spin animate-reverse"></div>
        </div>
        
        {/* Loading Message */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">{message}</p>
          <p className="text-sm text-gray-500 mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Components
export const SkeletonLoader = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLoader key={i} className="h-6 w-24" />
        ))}
      </div>
      
      {/* Row Skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 mb-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLoader 
              key={colIndex} 
              className={`h-8 ${colIndex === 0 ? 'w-32' : colIndex === 1 ? 'w-24' : 'w-20'}`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <SkeletonLoader className="h-6 w-32" />
        <SkeletonLoader className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonLoader className="h-8 w-20 mb-2" />
      <SkeletonLoader className="h-4 w-24" />
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <SkeletonLoader className="h-6 w-40 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <SkeletonLoader className="h-4 w-16" />
            <SkeletonLoader className={`h-6 ${i === 0 ? 'w-40' : i === 1 ? 'w-32' : i === 2 ? 'w-36' : i === 3 ? 'w-24' : 'w-28'}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalLoader;
