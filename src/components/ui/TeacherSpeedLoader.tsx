"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TeacherSpeedLoaderProps {
  isLoading: boolean;
  message?: string;
}

const TeacherSpeedLoader = ({ isLoading, message = "Loading..." }: TeacherSpeedLoaderProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center p-8"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Animated teacher icon */}
        <div className="relative">
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-white text-2xl font-bold">👨‍🏫</span>
          </motion.div>
          
          {/* Floating dots */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400 rounded-full"
              style={{
                top: "50%",
                left: "50%",
                marginTop: "-4px",
                marginLeft: "-4px",
              }}
              animate={{
                x: [0, 30 * Math.cos((i * 2 * Math.PI) / 3), 0],
                y: [0, 30 * Math.sin((i * 2 * Math.PI) / 3), 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-lg font-semibold text-gray-700 mb-1">{message}</p>
          <div className="flex space-x-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TeacherSpeedLoader;
