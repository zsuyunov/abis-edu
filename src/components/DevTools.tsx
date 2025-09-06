"use client";

import { useEffect, useState } from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiCalls: number;
  cacheHits: number;
}

export const DevTools = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
  });
  const [showDevTools, setShowDevTools] = useState(false);

  useEffect(() => {
    // Show dev tools only in development
    if (process.env.NODE_ENV === "development") {
      setShowDevTools(true);
      
      // Measure initial load time
      const startTime = performance.now();
      
      // Listen for performance entries
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            setMetrics(prev => ({
              ...prev,
              loadTime: entry.loadEventEnd - entry.loadEventStart,
            }));
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      
      // Measure render time
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime,
      }));

      return () => observer.disconnect();
    }
  }, []);

  // Monitor API calls and cache hits
  useEffect(() => {
    let apiCallCount = 0;
    let cacheHitCount = 0;

    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      apiCallCount++;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        // Check if request was fast (likely cached)
        if (endTime - startTime < 50) {
          cacheHitCount++;
        }
        
        setMetrics(prev => ({
          ...prev,
          apiCalls: apiCallCount,
          cacheHits: cacheHitCount,
        }));
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!showDevTools) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">🚀 Performance</span>
        <button
          onClick={() => setShowDevTools(false)}
          className="text-gray-300 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Load:</span>
          <span className={metrics.loadTime < 1000 ? "text-green-400" : "text-red-400"}>
            {metrics.loadTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render:</span>
          <span className={metrics.renderTime < 100 ? "text-green-400" : "text-red-400"}>
            {metrics.renderTime.toFixed(0)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>API Calls:</span>
          <span className="text-blue-400">{metrics.apiCalls}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Hits:</span>
          <span className="text-green-400">{metrics.cacheHits}</span>
        </div>
        
        <div className="flex justify-between border-t border-gray-600 pt-1 mt-1">
          <span>Cache Rate:</span>
          <span className="text-yellow-400">
            {metrics.apiCalls > 0 ? ((metrics.cacheHits / metrics.apiCalls) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-center">
          {metrics.loadTime < 1000 && metrics.renderTime < 100 ? (
            <span className="text-green-400">⚡ SUPER FAST</span>
          ) : (
            <span className="text-orange-400">⚠️ NEEDS OPTIMIZATION</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevTools;
