"use client";

import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  variant?: "card" | "list" | "table" | "dashboard" | "timetable" | "profile";
  count?: number;
  className?: string;
}

const SkeletonLoader = ({ variant = "card", count = 1, className = "" }: SkeletonLoaderProps) => {
  const shimmer = {
    animate: {
      backgroundPosition: ["200% 0", "-200% 0"],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear" as const,
    },
  };

  const skeletonBase = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded animate-pulse";

  if (variant === "card") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <motion.div
                className={`w-12 h-12 rounded-xl ${skeletonBase}`}
                animate={shimmer.animate}
                transition={shimmer.transition}
              />
              <div className="flex-1 space-y-3">
                <motion.div 
                  className={`h-4 w-3/4 ${skeletonBase}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`h-3 w-1/2 ${skeletonBase}`}
                  {...shimmer}
                />
                <div className="flex gap-2">
                  <motion.div 
                    className={`h-6 w-16 rounded-lg ${skeletonBase}`}
                    {...shimmer}
                  />
                  <motion.div 
                    className={`h-6 w-20 rounded-lg ${skeletonBase}`}
                    {...shimmer}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <motion.div 
                  className={`w-8 h-8 rounded-lg ${skeletonBase}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`w-8 h-8 rounded-lg ${skeletonBase}`}
                  {...shimmer}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
          >
            <motion.div 
              className={`w-8 h-8 rounded-full ${skeletonBase}`}
              {...shimmer}
            />
            <div className="flex-1 space-y-2">
              <motion.div 
                className={`h-3 w-2/3 ${skeletonBase}`}
                {...shimmer}
              />
              <motion.div 
                className={`h-2 w-1/3 ${skeletonBase}`}
                {...shimmer}
              />
            </div>
            <motion.div 
              className={`w-16 h-6 rounded ${skeletonBase}`}
              {...shimmer}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div 
                key={i}
                className={`h-4 ${skeletonBase}`}
                {...shimmer}
              />
            ))}
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: count }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-4"
            >
              <div className="grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-8 h-8 rounded-full ${skeletonBase}`}
                    {...shimmer}
                  />
                  <motion.div 
                    className={`h-3 w-20 ${skeletonBase}`}
                    {...shimmer}
                  />
                </div>
                <motion.div 
                  className={`h-3 w-16 ${skeletonBase}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`h-3 w-12 ${skeletonBase}`}
                  {...shimmer}
                />
                <div className="flex gap-2">
                  <motion.div 
                    className={`w-6 h-6 rounded ${skeletonBase}`}
                    {...shimmer}
                  />
                  <motion.div 
                    className={`w-6 h-6 rounded ${skeletonBase}`}
                    {...shimmer}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className={`w-10 h-10 rounded-xl ${skeletonBase}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`w-6 h-6 rounded ${skeletonBase}`}
                  {...shimmer}
                />
              </div>
              <motion.div 
                className={`h-8 w-16 mb-2 ${skeletonBase}`}
                {...shimmer}
              />
              <motion.div 
                className={`h-3 w-20 ${skeletonBase}`}
                {...shimmer}
              />
            </motion.div>
          ))}
        </div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <motion.div 
            className={`h-6 w-40 mb-4 ${skeletonBase}`}
            {...shimmer}
          />
          <motion.div 
            className={`h-64 w-full rounded-xl ${skeletonBase}`}
            {...shimmer}
          />
        </motion.div>
      </div>
    );
  }

  if (variant === "timetable") {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Calendar Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <motion.div 
              className={`w-8 h-8 rounded-lg ${skeletonBase}`}
              {...shimmer}
            />
            <motion.div 
              className={`h-6 w-32 ${skeletonBase}`}
              {...shimmer}
            />
            <motion.div 
              className={`w-8 h-8 rounded-lg ${skeletonBase}`}
              {...shimmer}
            />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className={`h-12 rounded-xl ${skeletonBase}`}
                {...shimmer}
              />
            ))}
          </div>
        </motion.div>

        {/* Timetable Entries */}
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-2">
                <motion.div 
                  className={`w-12 h-6 rounded-lg ${skeletonBase}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`w-20 h-6 rounded-lg ${skeletonBase}`}
                  {...shimmer}
                />
              </div>
              <motion.div 
                className={`w-16 h-6 rounded-lg ${skeletonBase}`}
                {...shimmer}
              />
            </div>
            <motion.div 
              className={`h-5 w-3/4 mb-2 ${skeletonBase}`}
              {...shimmer}
            />
            <motion.div 
              className={`h-4 w-1/2 mb-3 ${skeletonBase}`}
              {...shimmer}
            />
            <div className="flex gap-2">
              <motion.div 
                className={`w-8 h-8 rounded-xl ${skeletonBase}`}
                {...shimmer}
              />
              <motion.div 
                className={`w-8 h-8 rounded-xl ${skeletonBase}`}
                {...shimmer}
              />
              <motion.div 
                className={`w-8 h-8 rounded-xl ${skeletonBase}`}
                {...shimmer}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div 
            className={`w-16 h-16 rounded-2xl ${skeletonBase}`}
            {...shimmer}
          />
          <div className="flex-1">
            <motion.div 
              className={`h-5 w-40 mb-2 ${skeletonBase}`}
              {...shimmer}
            />
            <motion.div 
              className={`h-4 w-24 ${skeletonBase}`}
              {...shimmer}
            />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <motion.div 
                className={`h-4 w-20 ${skeletonBase}`}
                {...shimmer}
              />
              <motion.div 
                className={`h-4 w-32 ${skeletonBase}`}
                {...shimmer}
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Default card skeleton
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}
    >
      <motion.div 
        className={`h-4 w-3/4 mb-3 ${skeletonBase}`}
        {...shimmer}
      />
      <motion.div 
        className={`h-3 w-1/2 ${skeletonBase}`}
        {...shimmer}
      />
    </motion.div>
  );
};

export default SkeletonLoader;
