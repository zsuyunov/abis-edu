"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/components/providers/LoadingProvider";
import LoadingSpinner from "./LoadingSpinner";

const NavigationLoader = () => {
  const { isNavigating, navigationProgress } = useLoading();
  const [showLoader, setShowLoader] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isNavigating) {
      setShowLoader(true);
    } else {
      // Delay hiding to show completion animation
      const timer = setTimeout(() => setShowLoader(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isNavigating]);

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <LoadingSpinner 
              variant="educational" 
              size="lg" 
              text="Loading page..." 
            />
            
            {/* Progress bar */}
            <div className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                initial={{ width: "0%" }}
                animate={{ width: `${navigationProgress}%` }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              />
            </div>
            
            <p className="text-sm text-gray-600 mt-3">
              {navigationProgress < 30 && "Initializing..."}
              {navigationProgress >= 30 && navigationProgress < 60 && "Loading components..."}
              {navigationProgress >= 60 && navigationProgress < 90 && "Fetching data..."}
              {navigationProgress >= 90 && "Almost ready!"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavigationLoader;
