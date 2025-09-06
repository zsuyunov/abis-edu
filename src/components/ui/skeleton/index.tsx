"use client";

import { cn } from "@/lib/utils";

// Base skeleton component
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
        className
      )}
      {...props}
    />
  );
}

// Shimmer effect skeleton
export function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent dark:before:via-gray-700/60",
        className
      )}
      {...props}
    />
  );
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5, 
  cols = 4,
  showHeader = true 
}: { 
  rows?: number; 
  cols?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      {showHeader && (
        <div className="flex space-x-4 bg-gray-50 p-4 rounded-t-lg">
          {Array.from({ length: cols }).map((_, i) => (
            <ShimmerSkeleton 
              key={i} 
              className={cn(
                "h-4",
                i === 0 ? "w-32" : 
                i === 1 ? "w-24" : 
                i === 2 ? "w-20" : "w-16"
              )}
            />
          ))}
        </div>
      )}
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex space-x-4 p-4 border-b border-gray-100"
            style={{ animationDelay: `${rowIndex * 100}ms` }}
          >
            {Array.from({ length: cols }).map((_, colIndex) => (
              <ShimmerSkeleton 
                key={colIndex} 
                className={cn(
                  "h-6",
                  colIndex === 0 ? "w-32" : 
                  colIndex === 1 ? "w-24" : 
                  colIndex === 2 ? "w-20" : "w-16"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ 
  showAvatar = true,
  showActions = true 
}: { 
  showAvatar?: boolean;
  showActions?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showAvatar && <ShimmerSkeleton className="h-10 w-10 rounded-full" />}
          <div className="space-y-2">
            <ShimmerSkeleton className="h-4 w-32" />
            <ShimmerSkeleton className="h-3 w-24" />
          </div>
        </div>
        {showActions && <ShimmerSkeleton className="h-8 w-8 rounded-full" />}
      </div>
      <div className="space-y-2">
        <ShimmerSkeleton className="h-8 w-20" />
        <ShimmerSkeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// List skeleton
export function ListSkeleton({ 
  items = 5,
  showAvatar = true 
}: { 
  items?: number;
  showAvatar?: boolean;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex space-x-4 p-4 border-b border-gray-100">
          {showAvatar && <ShimmerSkeleton className="w-12 h-12 rounded-full" />}
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton className="h-4 w-3/4" />
            <ShimmerSkeleton className="h-4 w-1/2" />
          </div>
          <ShimmerSkeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={cn("w-full", height, "bg-white p-6 rounded-lg shadow-sm border")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <ShimmerSkeleton className="h-6 w-32" />
          <ShimmerSkeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <div className="flex items-end space-x-2 h-32">
            {Array.from({ length: 7 }).map((_, i) => (
              <ShimmerSkeleton 
                key={i} 
                className="flex-1"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <ShimmerSkeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} showAvatar={false} showActions={false} />
        ))}
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-80" />
        </div>
        <div>
          <ChartSkeleton height="h-80" />
        </div>
      </div>
      
      {/* Table section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ShimmerSkeleton className="h-6 w-32" />
            <ShimmerSkeleton className="h-10 w-24" />
          </div>
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
      <ShimmerSkeleton className="h-8 w-48" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <ShimmerSkeleton className="h-4 w-24" />
            <ShimmerSkeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      <div className="flex justify-end space-x-4">
        <ShimmerSkeleton className="h-10 w-20" />
        <ShimmerSkeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Navigation skeleton
export function NavSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <ShimmerSkeleton className="h-5 w-5" />
          <ShimmerSkeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// Calendar skeleton
export function CalendarSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-6 w-32" />
        <div className="flex space-x-2">
          <ShimmerSkeleton className="h-8 w-8" />
          <ShimmerSkeleton className="h-8 w-8" />
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Days of week */}
        {Array.from({ length: 7 }).map((_, i) => (
          <ShimmerSkeleton key={i} className="h-8 w-full" />
        ))}
        
        {/* Calendar days */}
        {Array.from({ length: 35 }).map((_, i) => (
          <ShimmerSkeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// Add shimmer keyframes to global CSS
export const shimmerStyles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
`;
