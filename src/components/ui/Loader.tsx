"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "bars";
  color?: "primary" | "secondary" | "white" | "gray";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loader({
  size = "md",
  variant = "spinner",
  color = "primary",
  text,
  fullScreen = false,
  className,
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white",
    gray: "text-gray-400",
  };

  const LoaderContent = () => {
    switch (variant) {
      case "spinner":
        return (
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-current border-t-transparent",
              sizeClasses[size],
              colorClasses[color]
            )}
          />
        );

      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full animate-pulse",
                  size === "sm" ? "w-1 h-1" : size === "md" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-4 h-4",
                  colorClasses[color].replace("text-", "bg-")
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>
        );

      case "pulse":
        return (
          <div
            className={cn(
              "rounded-full animate-pulse",
              sizeClasses[size],
              colorClasses[color].replace("text-", "bg-")
            )}
          />
        );

      case "bars":
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "animate-pulse",
                  size === "sm" ? "w-1" : size === "md" ? "w-1.5" : size === "lg" ? "w-2" : "w-3",
                  colorClasses[color].replace("text-", "bg-")
                )}
                style={{
                  height: `${12 + i * 4}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-current border-t-transparent",
              sizeClasses[size],
              colorClasses[color]
            )}
          />
        );
    }
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          <LoaderContent />
          {text && (
            <p className={cn("text-sm font-medium", colorClasses[color])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        <LoaderContent />
        {text && (
          <p className={cn("text-sm font-medium", colorClasses[color])}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Navigation Progress Bar
export function NavigationLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-200">
        <div className="h-full bg-blue-600 animate-pulse" style={{
          background: 'linear-gradient(90deg, transparent, #2563eb, transparent)',
          animation: 'loading-bar 2s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

// Page Loader for App Router
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader size="lg" variant="spinner" color="primary" />
        <p className="mt-4 text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

// Inline loader for components
export function InlineLoader({ 
  text, 
  size = "sm" 
}: { 
  text?: string; 
  size?: "sm" | "md" | "lg" 
}) {
  return (
    <div className="flex items-center space-x-2">
      <Loader size={size} variant="spinner" color="gray" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

// Button loader
export function ButtonLoader({ 
  loading, 
  children, 
  ...props 
}: { 
  loading: boolean; 
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <div className="flex items-center space-x-2">
          <Loader size="sm" variant="spinner" color="white" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Add CSS for loading bar animation
export const loaderStyles = `
@keyframes loading-bar {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}
`;
