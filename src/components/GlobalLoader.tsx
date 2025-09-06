'use client';

import React from 'react';
import { useLoading } from '@/components/providers/LoadingProvider';
import { Loader } from '@/components/ui/Loader';

export const GlobalLoader: React.FC = () => {
  const { isNavigating, isDataLoading, navigationProgress } = useLoading();

  if (!isNavigating && !isDataLoading) {
    return null;
  }

  return (
    <>
      {/* Navigation Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-blue-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{
                width: `${navigationProgress}%`,
                boxShadow: navigationProgress > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Data Loading Overlay */}
      {isDataLoading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center space-x-2 border border-gray-200 dark:border-gray-700">
            <Loader size="sm" variant="spinner" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Loading data...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalLoader;
