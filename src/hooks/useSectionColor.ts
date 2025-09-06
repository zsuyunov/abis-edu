"use client";

import { usePathname } from "next/navigation";

export const useSectionColor = () => {
  const pathname = usePathname();

  const getSectionColor = () => {
    if (pathname.includes("/branches")) {
      return {
        primary: "bg-green-500",
        light: "bg-green-100",
        text: "text-green-700",
        hover: "hover:bg-green-600",
        gradient: "from-green-400 to-green-600"
      };
    }
    
    if (pathname.includes("/users")) {
      return {
        primary: "bg-blue-500",
        light: "bg-blue-100", 
        text: "text-blue-700",
        hover: "hover:bg-blue-600",
        gradient: "from-blue-400 to-blue-600"
      };
    }
    
    if (pathname.includes("/teachers")) {
      return {
        primary: "bg-purple-500",
        light: "bg-purple-100",
        text: "text-purple-700", 
        hover: "hover:bg-purple-600",
        gradient: "from-purple-400 to-purple-600"
      };
    }
    
    if (pathname.includes("/students")) {
      return {
        primary: "bg-orange-500",
        light: "bg-orange-100",
        text: "text-orange-700",
        hover: "hover:bg-orange-600", 
        gradient: "from-orange-400 to-orange-600"
      };
    }
    
    if (pathname.includes("/lessons")) {
      return {
        primary: "bg-indigo-500",
        light: "bg-indigo-100",
        text: "text-indigo-700",
        hover: "hover:bg-indigo-600",
        gradient: "from-indigo-400 to-indigo-600"
      };
    }
    
    if (pathname.includes("/exams")) {
      return {
        primary: "bg-red-500", 
        light: "bg-red-100",
        text: "text-red-700",
        hover: "hover:bg-red-600",
        gradient: "from-red-400 to-red-600"
      };
    }
    
    if (pathname.includes("/subjects")) {
      return {
        primary: "bg-teal-500",
        light: "bg-teal-100", 
        text: "text-teal-700",
        hover: "hover:bg-teal-600",
        gradient: "from-teal-400 to-teal-600"
      };
    }
    
    if (pathname.includes("/classes")) {
      return {
        primary: "bg-yellow-500",
        light: "bg-yellow-100",
        text: "text-yellow-700", 
        hover: "hover:bg-yellow-600",
        gradient: "from-yellow-400 to-yellow-600"
      };
    }
    
    // Default colors
    return {
      primary: "bg-gray-500",
      light: "bg-gray-100",
      text: "text-gray-700",
      hover: "hover:bg-gray-600", 
      gradient: "from-gray-400 to-gray-600"
    };
  };

  return getSectionColor();
};
