"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SmoothTransitionProps {
  children: ReactNode;
  className?: string;
}

export const SmoothTransition = ({ children, className = "" }: SmoothTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Smooth entrance animation
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div 
      className={`transition-all duration-300 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Smooth card animation
export const SmoothCard = ({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transform transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Smooth table row animation
export const SmoothTableRow = ({ 
  children, 
  index = 0 
}: { 
  children: ReactNode; 
  index?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 30); // Stagger animation

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <tr 
      className={`transform transition-all duration-300 ease-out hover:bg-gray-50 ${
        isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-4'
      }`}
    >
      {children}
    </tr>
  );
};

export default SmoothTransition;
