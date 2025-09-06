"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Preload all critical routes for instant navigation
export default function InstantNavigator() {
  const router = useRouter();

  useEffect(() => {
    // Preload all admin routes for instant navigation
    const routes = [
      '/admin',
      '/list/users',
      '/list/teachers',
      '/list/students',
      '/list/parents',
      '/list/subjects',
      '/list/classes',
      '/list/branches',
      '/admin/gradebook',
      '/admin/attendance',
      '/admin/homework', 
      '/admin/documents',
      '/admin/complaints',
      '/admin/events',
      '/admin/messages'
    ];

    // Preload all routes immediately
    routes.forEach(route => {
      router.prefetch(route);
    });

    // Preload API endpoints
    const apiEndpoints = [
      '/api/auth/me',
      '/api/dashboard/stats',
      '/api/users',
      '/api/teachers',
      '/api/students',
      '/api/parents',
      '/api/subjects',
      '/api/classes',
      '/api/branches',
      '/api/grades',
      '/api/attendance'
    ];

    // Prefetch API data
    apiEndpoints.forEach(endpoint => {
      fetch(endpoint, { 
        method: 'GET',
        headers: { 'Cache-Control': 'max-age=300' }
      }).catch(() => {}); // Silent fail
    });

  }, [router]);

  return null;
}
