"use client";

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  DashboardSkeleton, 
  ChartSkeleton, 
  TableSkeleton, 
  FormSkeleton,
  CalendarSkeleton 
} from './ui/skeleton';

// Lazy load heavy components with proper loading states
export const LazyVirtualizedTable = dynamic(
  () => import('./VirtualizedTable'),
  {
    loading: () => <TableSkeleton rows={10} cols={5} />,
    ssr: false, // Disable SSR for virtualized components
  }
);

export const LazyStudentTable = dynamic(
  () => import('./VirtualizedTable').then(mod => ({ default: mod.StudentTable })),
  {
    loading: () => <TableSkeleton rows={10} cols={6} />,
    ssr: false,
  }
);

export const LazyAttendanceTable = dynamic(
  () => import('./VirtualizedTable').then(mod => ({ default: mod.AttendanceTable })),
  {
    loading: () => <TableSkeleton rows={10} cols={6} />,
    ssr: false,
  }
);

export const LazyTeacherTable = dynamic(
  () => import('./VirtualizedTable').then(mod => ({ default: mod.TeacherTable })),
  {
    loading: () => <TableSkeleton rows={10} cols={7} />,
    ssr: false,
  }
);

// Chart components - These will be created as needed
export const LazyCountChart = dynamic(
  () => import('./CountChartContainer'),
  {
    loading: () => <ChartSkeleton height="h-64" />,
    ssr: false,
  }
);

export const LazyAttendanceChart = dynamic(
  () => import('./AttendanceChartContainer'),
  {
    loading: () => <ChartSkeleton height="h-80" />,
    ssr: false,
  }
);

export const LazyFinanceChart = dynamic(
  () => import('./FinanceChart'),
  {
    loading: () => <ChartSkeleton height="h-96" />,
    ssr: false,
  }
);

// Calendar components
export const LazyBigCalendar = dynamic(
  () => import('./BigCalender'),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false,
  }
);

export const LazyEventCalendar = dynamic(
  () => import('./EventCalendarContainer'),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false,
  }
);

// Form components
export const LazyFormModal = dynamic(
  () => import('./FormModal'),
  {
    loading: () => <FormSkeleton fields={6} />,
    ssr: true, // Forms can be SSR'd
  }
);

// Performance wrapper component
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function LazyWrapper({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />,
  delay = 0 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {delay > 0 ? (
        <DelayedComponent delay={delay}>
          {children}
        </DelayedComponent>
      ) : (
        children
      )}
    </Suspense>
  );
}

// Delayed component for staggered loading
function DelayedComponent({ 
  children, 
  delay 
}: { 
  children: React.ReactNode; 
  delay: number 
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />;
  }

  return <>{children}</>;
}

// Intersection Observer based lazy loading
export function IntersectionLazy({ 
  children, 
  fallback,
  rootMargin = "50px",
  threshold = 0.1 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return (
    <div ref={setRef}>
      {isVisible ? children : (fallback || <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
    </div>
  );
}

// Code splitting utility for route-based components
export function createLazyRoute(importFn: () => Promise<any>, fallback?: React.ReactNode) {
  return dynamic(importFn, {
    loading: () => (fallback as React.ReactElement) || <DashboardSkeleton />,
    ssr: true,
  });
}

// Preload utility for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Preload on idle or after a short delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFn());
    } else {
      setTimeout(() => importFn(), 100);
    }
  }
}

// Export preload functions for critical components
export const preloadVirtualizedTable = () => preloadComponent(() => import('./VirtualizedTable'));
export const preloadCharts = () => {
  preloadComponent(() => import('./CountChart'));
  preloadComponent(() => import('./AttendanceChart'));
  preloadComponent(() => import('./FinanceChart'));
};
export const preloadCalendar = () => preloadComponent(() => import('./BigCalender'));

// Hook for progressive loading
export function useProgressiveLoading(components: (() => Promise<any>)[], delay = 100) {
  useEffect(() => {
    components.forEach((component, index) => {
      setTimeout(() => {
        preloadComponent(component);
      }, index * delay);
    });
  }, [components, delay]);
}
