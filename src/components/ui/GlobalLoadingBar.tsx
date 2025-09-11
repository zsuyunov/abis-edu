"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/components/providers/LoadingProvider";

const GlobalLoadingBar = () => {
  const { isNavigating, navigationProgress } = useLoading();

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          {/* Progress Bar */}
          <div className="h-1 bg-gray-200/50 backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: `${navigationProgress}%` }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            />
          </div>
          
          {/* Animated dots */}
          <div className="absolute top-1 right-4 flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoadingBar;
