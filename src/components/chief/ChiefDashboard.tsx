"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

interface ChiefStats {
  totalMealPlans: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  autoApproved: number;
}

const ChiefDashboard = () => {
  const { data: stats, isLoading } = useQuery<ChiefStats>({
    queryKey: ["chief-stats"],
    queryFn: async () => {
      const response = await fetch("/api/chief/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
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
      title: "Total Meal Plans",
      value: stats?.totalMealPlans || 0,
      color: "bg-blue-500",
      icon: "📋",
    },
    {
      title: "Pending Approval",
      value: stats?.pendingApproval || 0,
      color: "bg-yellow-500",
      icon: "⏳",
    },
    {
      title: "Approved",
      value: stats?.approved || 0,
      color: "bg-green-500",
      icon: "✅",
    },
    {
      title: "Rejected",
      value: stats?.rejected || 0,
      color: "bg-red-500",
      icon: "❌",
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Chief Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back! Here's your meal plan overview.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              onClick={() => window.location.href = '/chief/meal-plan'}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🍽️</span>
                <div>
                  <p className="font-medium text-gray-800">Create Weekly Meal Plan</p>
                  <p className="text-sm text-gray-600">Plan meals for the upcoming week</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => window.location.href = '/chief/meal-calendar'}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 rounded-lg bg-gray-50">
              <span className="text-2xl mr-3">📝</span>
              <div>
                <p className="font-medium text-gray-800">No recent activity</p>
                <p className="text-sm text-gray-600">Create your first meal plan to get started</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiefDashboard;
