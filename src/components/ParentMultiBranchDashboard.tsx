"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import BranchSelector from "./BranchSelector";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  class: any;
  branch: any;
}

interface Branch {
  id: number;
  shortName: string;
  legalName: string;
  status: string;
}

interface ParentMultiBranchDashboardProps {
  parentId: string;
  childrenDataData: Child[];
  onBranchChange: (branchId: number) => void;
  onChildChange: (childId: string) => void;
  selectedBranchId?: number;
  selectedChildId?: string;
}

const ParentMultiBranchDashboard = ({
  parentId,
  childrenDataData,
  onBranchChange,
  onChildChange,
  selectedBranchId,
  selectedChildId,
}: ParentMultiBranchDashboardProps) => {
  const [childrenDataByBranch, setChildrenByBranch] = useState<Record<number, Child[]>>({});
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    organizeChildrenByBranch();
  }, [childrenData]);

  const organizeChildrenByBranch = () => {
    const branchMap: Record<number, Child[]> = {};
    const uniqueBranches: Branch[] = [];

    childrenData.forEach(child => {
      const branchId = child.branch.id;
      
      // Add child to branch group
      if (!branchMap[branchId]) {
        branchMap[branchId] = [];
        uniqueBranches.push(child.branch);
      }
      branchMap[branchId].push(child);
    });

    setChildrenByBranch(branchMap);
    setBranches(uniqueBranches.sort((a, b) => a.shortName.localeCompare(b.shortName)));
  };

  const handleBranchChange = (branchId: number, branch: Branch) => {
    onBranchChange(branchId);
    
    // Auto-select first child in the new branch
    const childrenDataInBranch = childrenDataByBranch[branchId];
    if (childrenDataInBranch && childrenDataInBranch.length > 0) {
      onChildChange(childrenDataInBranch[0].id);
    }
  };

  const getChildrenInSelectedBranch = () => {
    if (!selectedBranchId) return [];
    return childrenDataByBranch[selectedBranchId] || [];
  };

  const getSelectedBranch = () => {
    return branches.find(b => b.id === selectedBranchId);
  };

  // If only one branch, don't show branch selector
  if (branches.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Image src="/student.png" alt="Multi-Branch" width={20} height={20} />
          <h3 className="font-medium text-blue-900">Multi-Branch Family</h3>
        </div>
        <div className="text-sm text-blue-700">
          Your childrenData are enrolled in {branches.length} different branches
        </div>
      </div>

      {/* Branch Selector */}
      <div className="mb-4">
        <BranchSelector
          userRole="parent"
          userId={parentId}
          selectedBranchId={selectedBranchId}
          onBranchChange={handleBranchChange}
          showLabel={true}
          className="flex-1"
        />
      </div>

      {/* Children in Selected Branch */}
      {selectedBranchId && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900">
              Children in {getSelectedBranch()?.shortName}
            </h4>
            <div className="text-xs text-blue-600">
              {getChildrenInSelectedBranch().length} child{getChildrenInSelectedBranch().length !== 1 ? 'ren' : ''}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getChildrenInSelectedBranch().map((child) => (
              <div
                key={child.id}
                onClick={() => onChildChange(child.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedChildId === child.id
                    ? "border-blue-500 bg-blue-100 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedChildId === child.id ? "bg-blue-500" : "bg-gray-400"
                  }`}>
                    <Image 
                      src="/student.png" 
                      alt="Student" 
                      width={16} 
                      height={16} 
                      className="invert" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${
                      selectedChildId === child.id ? "text-blue-900" : "text-gray-900"
                    }`}>
                      {child.firstName} {child.lastName}
                    </div>
                    <div className={`text-xs truncate ${
                      selectedChildId === child.id ? "text-blue-700" : "text-gray-600"
                    }`}>
                      {child.studentId} • {child.class.name}
                    </div>
                  </div>
                </div>
                
                {selectedChildId === child.id && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Currently Viewing
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branch Summary */}
      <div className="mt-4 pt-3 border-t border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 p-3 rounded border">
            <div className="text-lg font-bold text-blue-600">{branches.length}</div>
            <div className="text-xs text-blue-700">Branch{branches.length !== 1 ? 'es' : ''}</div>
          </div>
          <div className="bg-white/50 p-3 rounded border">
            <div className="text-lg font-bold text-blue-600">{childrenData.length}</div>
            <div className="text-xs text-blue-700">Total Children</div>
          </div>
          <div className="bg-white/50 p-3 rounded border">
            <div className="text-lg font-bold text-blue-600">
              {selectedBranchId ? getChildrenInSelectedBranch().length : 0}
            </div>
            <div className="text-xs text-blue-700">In Selected Branch</div>
          </div>
        </div>
      </div>

      {/* Branch Details */}
      {getSelectedBranch() && (
        <div className="mt-4 p-3 bg-white/30 rounded border">
          <div className="text-xs text-blue-800">
            <strong>Selected Branch:</strong> {getSelectedBranch()?.legalName}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            All academic data below is filtered to show only information from this branch.
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentMultiBranchDashboard;
