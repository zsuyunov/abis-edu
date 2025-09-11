/*
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

interface DashboardStats {
  totalStudents: number;
  totalParents: number;
  newAdmissionsThisMonth: number;
  pendingApplications: number;
  branchInfo: {
    branchId: number;
    branchName: string;
  };
  recentAdmissions: {
    id: string;
    name: string;
    admissionDate: string;
    status: string;
  }[];
}

const SupportAdmissionDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/support-admission/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.data); // Fix: Extract data from response
      } else {
        showToast({ type: "error", title: "Failed to load dashboard data" });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      showToast({ type: "error", title: "Error loading dashboard" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-4">
          <Image src="/loader-beruniy.gif" alt="Loading..." width={50} height={50} />
          <span className="text-purple-600 font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header }
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Support Admission Dashboard</h1>
        <p className="text-gray-600">
          Branch-specific admission management - {stats?.branchInfo?.branchName || 'Your Branch'}
        </p>
      </div>

      {/* Stats Cards }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Branch Students</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.totalStudents || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Image src="/student.png" alt="Students" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Branch Parents</p>
              <p className="text-2xl font-bold text-indigo-600">{stats?.totalParents || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <Image src="/parent.png" alt="Parents" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Admissions</p>
              <p className="text-2xl font-bold text-green-600">{stats?.newAdmissionsThisMonth || 0}</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Image src="/create.png" alt="New" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.pendingApplications || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Image src="/calendar.png" alt="Pending" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Admission Progress }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Admission Progress This Year</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Target</span>
              <span className="font-medium">{stats?.admissionProgress?.target || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Achieved</span>
              <span className="font-medium text-purple-600">{stats?.admissionProgress?.achieved || 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats?.admissionProgress?.percentage || 0, 100)}%` }}
              ></div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-purple-600">
                {stats?.admissionProgress?.percentage?.toFixed(1) || 0}%
              </span>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
        </div>

        {/* Recent Admissions }
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Admissions</h3>
          <div className="space-y-4">
            {stats?.recentAdmissions?.map((admission) => (
              <div key={admission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">{admission.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(admission.admissionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    admission.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {admission.status}
                  </span>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent admissions</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions }
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/support-admission/students'}
            className="flex items-center gap-3 p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Image src="/student.png" alt="Students" width={24} height={24} />
            <span className="font-medium text-gray-700">Manage Students</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/support-admission/parents'}
            className="flex items-center gap-3 p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Image src="/parent.png" alt="Parents" width={24} height={24} />
            <span className="font-medium text-gray-700">Manage Parents</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/support-admission/announcements'}
            className="flex items-center gap-3 p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Image src="/announcement.png" alt="Announcements" width={24} height={24} />
            <span className="font-medium text-gray-700">Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Branch Information }
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-full">
            <Image src="/singleBranch.png" alt="Branch" width={24} height={24} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Your Assigned Branch</h4>
            <p className="text-gray-600">{stats?.branchInfo?.branchName || 'Branch Name'}</p>
            <p className="text-sm text-gray-500">You can only manage admissions for this branch</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportAdmissionDashboard;

*/