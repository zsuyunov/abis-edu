"use client";

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useLoading } from '@/components/providers/LoadingProvider';

export function useNavigation() {
  const router = useRouter();
  const { showNavigation, hideNavigation, showLoader, hideLoader } = useLoading();

  const navigateTo = useCallback((path: string) => {
    // Show the GIF loader immediately
    showNavigation();
    showLoader('Navigating...');
    
    // Preload the route
    router.prefetch(path);
    
    // Navigate immediately for speed
    router.push(path);
    
    // Keep loader visible until page is fully loaded
    setTimeout(() => {
      hideNavigation();
      hideLoader();
    }, 800); // Keep visible for 800ms to ensure page loads
  }, [router, showNavigation, hideNavigation, showLoader, hideLoader]);

  const replace = useCallback((path: string) => {
    showNavigation();
    showLoader('Redirecting...');
    
    router.prefetch(path);
    router.replace(path);
    
    // Keep loader visible until page is fully loaded
    setTimeout(() => {
      hideNavigation();
      hideLoader();
    }, 800); // Keep visible for 800ms to ensure page loads
  }, [router, showNavigation, hideNavigation, showLoader, hideLoader]);

  return {
    navigateTo,
    replace,
    router
  };
}
