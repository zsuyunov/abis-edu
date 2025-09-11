"use client";

import { motion } from "framer-motion";
import { Loader2, BookOpen, Users, Calendar, BarChart3 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "pulse" | "bounce" | "educational";
  text?: string;
  className?: string;
}

const LoadingSpinner = ({ 
  size = "md", 
  variant = "default", 
  text,
  className = "" 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  if (variant === "dots") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`bg-blue-500 rounded-full ${size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3"}`}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`text-gray-600 font-medium ${textSizes[size]}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <motion.div
          className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full ${sizeClasses[size]}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <p className={`text-gray-600 font-medium ${textSizes[size]}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "bounce") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-full ${size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3"}`}
              animate={{
                y: [0, -15, 0],
                scale: [1, 0.8, 1]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        {text && (
          <p className={`text-gray-600 font-medium ${textSizes[size]}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "educational") {
    const icons = [BookOpen, Users, Calendar, BarChart3];
    
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="relative grid grid-cols-2 gap-2 p-4">
            {icons.map((Icon, i) => (
              <motion.div
                key={i}
                className="p-2 bg-white rounded-lg shadow-sm"
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              >
                <Icon className="w-4 h-4 text-blue-600" />
              </motion.div>
            ))}
          </div>
        </div>
        {text && (
          <div className="text-center">
            <p className={`text-gray-700 font-semibold ${textSizes[size]}`}>
              {text}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Please wait while we load your data...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`text-blue-500 ${sizeClasses[size]}`} />
      </motion.div>
      {text && (
        <p className={`text-gray-600 font-medium ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
