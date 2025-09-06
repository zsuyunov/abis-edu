"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Branch {
  id: number;
  shortName: string;
  legalName: string;
  status: string;
}

interface BranchSelectorProps {
  userRole: "teacher" | "student" | "parent";
  userId: string;
  selectedBranchId?: number;
  onBranchChange: (branchId: number, branch: Branch) => void;
  showLabel?: boolean;
  className?: string;
}

const BranchSelector = ({
  userRole,
  userId,
  selectedBranchId,
  onBranchChange,
  showLabel = true,
  className = "",
}: BranchSelectorProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserBranches();
  }, [userId, userRole]);

  const fetchUserBranches = async () => {
    try {
      setLoading(true);
      setError("");

      let endpoint = "";
      switch (userRole) {
        case "teacher":
          // Teachers have only one branch assigned
          const teacherResponse = await fetch(`/api/users/${userId}`);
          if (teacherResponse.ok) {
            const teacherData = await teacherResponse.json();
            if (teacherData.teacher?.branch) {
              setBranches([teacherData.teacher.branch]);
              // Auto-select the teacher's branch
              if (!selectedBranchId) {
                onBranchChange(teacherData.teacher.branch.id, teacherData.teacher.branch);
              }
            }
          }
          break;

        case "student":
          // Students have only one branch assigned
          const studentResponse = await fetch(`/api/users/${userId}`);
          if (studentResponse.ok) {
            const studentData = await studentResponse.json();
            if (studentData.student?.branch) {
              setBranches([studentData.student.branch]);
              // Auto-select the student's branch
              if (!selectedBranchId) {
                onBranchChange(studentData.student.branch.id, studentData.student.branch);
              }
            }
          }
          break;

        case "parent":
          // Parents might have children in multiple branches
          const parentResponse = await fetch(`/api/parent-gradebook?parentId=${userId}`);
          if (parentResponse.ok) {
            const parentData = await parentResponse.json();
            if (parentData.children && parentData.children.length > 0) {
              // Get unique branches from children
              const uniqueBranches = parentData.children.reduce((acc: Branch[], child: any) => {
                if (!acc.find(b => b.id === child.branch.id)) {
                  acc.push(child.branch);
                }
                return acc;
              }, []);
              setBranches(uniqueBranches);
              
              // Auto-select first branch if none selected
              if (!selectedBranchId && uniqueBranches.length > 0) {
                onBranchChange(uniqueBranches[0].id, uniqueBranches[0]);
              }
            }
          }
          break;
      }
    } catch (error) {
      console.error("Error fetching user branches:", error);
      setError("Failed to load branch information");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === parseInt(branchId));
    if (branch) {
      onBranchChange(branch.id, branch);
    }
  };

  // Don't render if user has only one branch (common case)
  if (branches.length <= 1) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-10 w-48 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        <div className="flex items-center gap-2">
          <Image src="/close.png" alt="Error" width={16} height={16} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Branch:
        </label>
      )}
      
      <div className="relative">
        <select
          value={selectedBranchId || ""}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-lamaSky focus:border-transparent min-w-[200px]"
        >
          <option value="">Select a branch...</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.shortName} - {branch.legalName}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <Image 
            src="/sort.png" 
            alt="Dropdown" 
            width={12} 
            height={12} 
            className="opacity-50"
          />
        </div>
      </div>

      {/* Branch Status Indicator */}
      {selectedBranchId && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">
            {branches.find(b => b.id === selectedBranchId)?.status || "ACTIVE"}
          </span>
        </div>
      )}

      {/* Branch Info */}
      {userRole === "parent" && branches.length > 1 && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {branches.length} branch{branches.length !== 1 ? 'es' : ''} available
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
