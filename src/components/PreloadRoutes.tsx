"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Critical admin routes to preload
const CRITICAL_ROUTES = [
  "/admin",
  "/list/users", 
  "/admin/gradebook",
  "/admin/attendance",
  "/list/teachers",
  "/list/students",
  "/list/parents",
];

export const PreloadRoutes = () => {
  const router = useRouter();

  useEffect(() => {
    // Preload critical routes after initial load
    const preloadTimer = setTimeout(() => {
      CRITICAL_ROUTES.forEach(route => {
        router.prefetch(route);
      });
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, [router]);

  return null;
};

export default PreloadRoutes;
