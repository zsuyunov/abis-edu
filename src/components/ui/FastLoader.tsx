"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FastLoaderProps {
  isLoading: boolean;
  message?: string;
  variant?: "spinner" | "dots" | "pulse" | "bars";
  size?: "sm" | "md" | "lg";
  overlay?: boolean;
}

const FastLoader = ({ 
  isLoading, 
  message = "Loading...", 
  variant = "spinner",
  size = "md",
  overlay = false 
}: FastLoaderProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const containerClasses = overlay 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    : "flex items-center justify-center p-4";

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`${sizeClasses[size]} bg-blue-500 rounded-full`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        );
      
      case "pulse":
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-blue-500 rounded-full`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        );
      
      case "bars":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-blue-500 rounded-full"
                style={{ height: size === "sm" ? "16px" : size === "md" ? "24px" : "32px" }}
                animate={{
                  scaleY: [1, 2, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        );
      
      default: // spinner
        return (
          <motion.div
            className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-500 rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={containerClasses}
    >
      <div className="flex flex-col items-center space-y-3">
        {renderLoader()}
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-gray-600 font-medium"
          >
            {message}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default FastLoader;
