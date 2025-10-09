"use client";

import { useState } from "react";
import { csrfFetch } from '@/hooks/useCsrfToken';
import { toast } from "react-toastify";

const AcademicYearAutoDeactivateButton = () => {
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const handleAutoDeactivate = async () => {
    setLoading(true);
    try {
      const response = await csrfFetch("/api/academic-years/auto-deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setLastCheck(new Date().toLocaleString());
        // Refresh the page to show updated statuses
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to auto-deactivate academic years");
      }
    } catch (error) {
      console.error("Error auto-deactivating academic years:", error);
      toast.error("Failed to auto-deactivate academic years");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await csrfFetch("/api/academic-years/auto-deactivate");
      if (response.ok) {
        const result = await response.json();
        const overdueYears = result.activeYears.filter((year: any) => year.shouldDeactivate);
        
        if (overdueYears.length > 0) {
          toast.info(`${overdueYears.length} academic year(s) should be deactivated. Click "Auto-Deactivate" to proceed.`);
        } else {
          toast.info("All academic years are up to date!");
        }
        setLastCheck(new Date().toLocaleString());
      }
    } catch (error) {
      toast.error("Failed to check academic year status");
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Academic Year Auto-Deactivation
          </h3>
          <p className="text-xs text-yellow-700 mt-1">
            Automatically deactivate academic years that have passed their end date
          </p>
          {lastCheck && (
            <p className="text-xs text-yellow-600 mt-1">
              Last checked: {lastCheck}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkStatus}
            className="px-3 py-2 text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors"
          >
            Check Status
          </button>
          <button
            onClick={handleAutoDeactivate}
            disabled={loading}
            className="px-3 py-2 text-xs font-medium text-white bg-yellow-600 border border-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Auto-Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearAutoDeactivateButton;
