"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

interface DoctorStats {
  pendingApprovals: number;
  totalApproved: number;
  totalRejected: number;
}

const DoctorDashboard = () => {
  const { data: stats, isLoading } = useQuery<DoctorStats>({
    queryKey: ["doctor-stats"],
    queryFn: async () => {
      const response = await fetch("/api/doctor/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      color: "bg-yellow-500",
      icon: "⏳",
    },
    {
      title: "Total Approved",
      value: stats?.totalApproved || 0,
      color: "bg-green-500",
      icon: "✅",
    },
    {
      title: "Total Rejected",
      value: stats?.totalRejected || 0,
      color: "bg-red-500",
      icon: "❌",
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Doctor Dashboard</h1>
        <div className="text-sm text-gray-500">
          Review and approve meal plans for your branch.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/doctor/meal-approvals'}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <p className="font-medium text-gray-800">Review Meal Plans</p>
                  <p className="text-sm text-gray-600">Approve or reject pending meal plans</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/doctor/meal-calendar'}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-gray-800">View Meal Calendar</p>
                  <p className="text-sm text-gray-600">See approved meal plans</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Guidelines</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <p className="font-medium text-gray-800">Nutritional Balance</p>
                <p className="text-gray-600">Ensure meals provide proper nutrition</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <p className="font-medium text-gray-800">Allergen Safety</p>
                <p className="text-gray-600">Check for common allergens and safety</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <div>
                <p className="font-medium text-gray-800">Health Standards</p>
                <p className="text-gray-600">Verify meals meet health requirements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-approval Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-blue-600 text-xl mr-3">ℹ️</span>
          <div>
            <p className="font-medium text-blue-800">Auto-Approval Notice</p>
            <p className="text-sm text-blue-700">
              Meal plans that are not approved or rejected within 5 hours will be automatically approved and appear on the meal calendar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
