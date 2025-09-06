"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ParentMultiBranchDashboard from "./ParentMultiBranchDashboard";

interface ParentChildAttendanceSelectorProps {
  parentId: string;
  childrenData: any[];
  selectedChildId: string;
  selectedBranchId?: number;
  onChildChange: (childId: string) => void;
  onBranchChange?: (branchId: number) => void;
  onDataUpdate: (data: any) => void;
  loading: boolean;
}

const ParentChildAttendanceSelector = ({
  parentId,
  childrenData,
  selectedChildId,
  selectedBranchId,
  onChildChange,
  onBranchChange,
  onDataUpdate,
  loading,
}: ParentChildAttendanceSelectorProps) => {
  const [error, setError] = useState("");

  useEffect(() => {
    if (parentId) {
      fetchParentData();
    }
  }, [parentId, selectedChildId, selectedBranchId]);

  const fetchParentData = async () => {
    setError("");
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("parentId", parentId);
      if (selectedChildId) queryParams.append("childId", selectedChildId);
      if (selectedBranchId) queryParams.append("branchId", selectedBranchId.toString());

      const response = await fetch(`/api/parent-attendance?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      onDataUpdate(data);
    } catch (e: any) {
      setError(e.message);
      console.error("Error fetching parent attendance data:", e);
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
    const branches = childrenData.map(child => child.branch);
    return branches.filter((branch, index, self) => 
      index === self.findIndex(b => b.id === branch.id)
    );
  };

  const uniqueBranches = getUniqueBranches();
  const hasMultipleBranches = uniqueBranches.length > 1;

  const getChildStatusBadge = (child: any) => {
    const currentDate = new Date();
    const academicYearEnd = new Date(child.class.academicYear.endDate);
    
    if (currentDate > academicYearEnd) {
      return <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">Past Year</span>;
    } else {
      return <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Current Year</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">👨‍👩‍👧‍👦</div>
          <p className="text-gray-500">Loading children attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span>❌</span>
          <span className="font-medium">Error Loading Data</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchParentData}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (childrenData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
        <h3 className="font-semibold text-yellow-800 mb-2">No Children Assigned</h3>
        <p className="text-yellow-700 text-sm">
          No children are currently assigned to this parent account. Please contact the school administration if this is incorrect.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Multi-Branch Dashboard for parents with children in different branches */}
      {hasMultipleBranches && onBranchChange && (
        <ParentMultiBranchDashboard
          parentId={parentId}
          childrenData={childrenData}
          selectedBranchId={selectedBranchId}
          selectedChildId={selectedChildId}
          onBranchChange={handleBranchChange}
          onChildChange={handleChildSelection}
        />
      )}

      {childrenData.length === 1 ? (
        // Single child display
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <Image src="/student.png" alt="Student" width={32} height={32} className="invert" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-blue-800 flex items-center">
                  {children[0].firstName} {children[0].lastName} ({children[0].studentId})
                  {getChildStatusBadge(children[0])}
                </h3>
                <div className="text-sm text-blue-600 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Image src="/class.png" alt="Class" width={16} height={16} />
                    Class: {children[0].class.name}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Image src="/singleBranch.png" alt="Branch" width={16} height={16} />
                    Branch: {children[0].branch.shortName}
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Academic Year: {children[0].class.academicYear.name}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-blue-300">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">Child</div>
            </div>
          </div>
        </div>
      ) : (
        // Multiple children selector (if not using multi-branch dashboard or if all children are in one branch)
        !hasMultipleBranches && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span>
                Select Child to View Attendance
              </h3>
              <div className="text-sm text-blue-600">
                {childrenData.length} Children
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {childrenData.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelection(child.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedChildId === child.id
                      ? "border-blue-500 bg-blue-100 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedChildId === child.id ? "bg-blue-500" : "bg-gray-400"
                    }`}>
                      <Image src="/student.png" alt="Student" width={24} height={24} className="invert" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        selectedChildId === child.id ? "text-blue-900" : "text-gray-900"
                      }`}>
                        {child.firstName} {child.lastName}
                      </div>
                      <div className="text-xs text-gray-600">
                        ID: {child.studentId}
                      </div>
                      <div className="text-xs text-gray-600">
                        {child.class.name} • {child.branch.shortName}
                      </div>
                      {getChildStatusBadge(child)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedChildId && (
              <div className="mt-4 p-3 bg-white rounded-md border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Currently viewing:</strong> {childrenData.find(c => c.id === selectedChildId)?.firstName} {childrenData.find(c => c.id === selectedChildId)?.lastName}'s attendance data
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Quick Child Switch (for mobile) */}
      {childrenData.length > 1 && !hasMultipleBranches && (
        <div className="mt-4 md:hidden">
          <label htmlFor="mobile-child-select" className="block text-sm font-medium text-gray-700 mb-2">
            Quick Switch Child:
          </label>
          <select
            id="mobile-child-select"
            value={selectedChildId}
            onChange={(e) => handleChildSelection(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">Select a child...</option>
            {childrenData.map((child) => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName} ({child.studentId}) - {child.class.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ParentChildAttendanceSelector;
