/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ParentMultiBranchDashboard from "./ParentMultiBranchDashboard";

interface ParentChildSelectorProps {
  parentId: string;
  children: any[];
  selectedChildId: string;
  selectedBranchId?: number;
  onChildChange: (childId: string) => void;
  onBranchChange?: (branchId: number) => void;
  onParentDataUpdate: (data: any) => void;
}

const ParentChildSelector = ({
  parentId,
  children,
  selectedChildId,
  selectedBranchId,
  onChildChange,
  onBranchChange,
  onParentDataUpdate,
}: ParentChildSelectorProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchParentData();
  }, [parentId]);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent-gradebook?parentId=${parentId}`);
      if (response.ok) {
        const data = await response.json();
        onParentDataUpdate(data);
        
        // Auto-select first child if none selected
        if (!selectedChildId && data.children && data.children.length > 0) {
          onChildChange(data.children[0].id);
        }
      } else {
        setError("Failed to load children data");
      }
    } catch (error) {
      console.error("Error fetching parent data:", error);
      setError("Failed to load children data");
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelection = (childId: string) => {
    onChildChange(childId);
  };

  const handleBranchChange = (branchId: number) => {
    if (onBranchChange) {
      onBranchChange(branchId);
    }
  };

  // Get unique branches from children
  const getUniqueBranches = () => {
    const branches = children.map(child => child.branch);
    return branches.filter((branch, index, self) => 
      index === self.findIndex(b => b.id === branch.id)
    );
  };

  const uniqueBranches = getUniqueBranches();
  const hasMultipleBranches = uniqueBranches.length > 1;

  const getChildStatusBadge = (child: any) => {
    const currentDate = new Date();
    const academicYearEnd = new Date(child.class.academicYear.endDate);
    
    if (child.class.academicYear.isCurrent) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else if (academicYearEnd < currentDate) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Alumni
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Inactive
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2">
          <Image src="/close.png" alt="Error" width={16} height={16} />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-md text-center">
        <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Found</h3>
        <p className="text-gray-600 text-sm">
          No student records are associated with your parent account. 
          Please contact the school administration if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Multi-Branch Dashboard for parents with children in different branches }
      {hasMultipleBranches && onBranchChange && (
        <ParentMultiBranchDashboard
          parentId={parentId}
          children={children}
          selectedBranchId={selectedBranchId}
          selectedChildId={selectedChildId}
          onBranchChange={handleBranchChange}
          onChildChange={handleChildSelection}
        />
      )}

      {children.length === 1 ? (
        // Single child display
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Image src="/student.png" alt="Student" width={24} height={24} className="invert" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {children[0].firstName} {children[0].lastName}
                </h3>
                <div className="text-sm text-blue-700">
                  Student ID: {children[0].studentId} • Class: {children[0].class.name} • Branch: {children[0].branch.name}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Academic Year: {children[0].class.academicYear.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getChildStatusBadge(children[0])}
            </div>
          </div>
        </div>
      ) : (
        // Multiple children selector
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Child to View Academic Performance
          </label>
          
          {/* Dropdown Selector }
          <div className="mb-4">
            <select
              value={selectedChildId}
              onChange={(e) => handleChildSelection(e.target.value)}
              className="w-full md:w-auto min-w-[300px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaSky focus:border-transparent text-sm"
            >
              <option value="">Select a child...</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName} - {child.class.name} ({child.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Children Cards Grid }
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div
                key={child.id}
                onClick={() => handleChildSelection(child.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedChildId === child.id
                    ? "border-lamaSky bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedChildId === child.id ? "bg-lamaSky" : "bg-gray-400"
                  }`}>
                    <Image 
                      src="/student.png" 
                      alt="Student" 
                      width={20} 
                      height={20} 
                      className="invert" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      selectedChildId === child.id ? "text-blue-900" : "text-gray-900"
                    }`}>
                      {child.firstName} {child.lastName}
                    </h4>
                    <div className={`text-xs truncate ${
                      selectedChildId === child.id ? "text-blue-700" : "text-gray-600"
                    }`}>
                      {child.studentId} • {child.class.name}
                    </div>
                    <div className={`text-xs truncate ${
                      selectedChildId === child.id ? "text-blue-600" : "text-gray-500"
                    }`}>
                      {child.branch.name}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className={`text-xs ${
                    selectedChildId === child.id ? "text-blue-600" : "text-gray-500"
                  }`}>
                    {child.class.academicYear.name}
                  </div>
                  {getChildStatusBadge(child)}
                </div>
                
                {selectedChildId === child.id && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Currently Viewing
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Stats Summary }
          {selectedChildId && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Quick Tip:</strong> Use the dropdown above for quick switching, or click on child cards to select. 
                All academic data will automatically update to show the selected child's performance.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total Children Indicator }
      {children.length > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Total Children: {children.length}</span>
          <span>
            Active: {children.filter(child => child.class.academicYear.isCurrent).length} • 
            Alumni: {children.filter(child => !child.class.academicYear.isCurrent).length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ParentChildSelector;

*/