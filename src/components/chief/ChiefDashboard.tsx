/*
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  ChefHat, 
  Clock, 
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  BarChart3,
  MapPin,
  Timer,
  Shield,
  Sparkles,
  Activity
} from "lucide-react";

interface MealPlanStats {
  totalMealPlans: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  autoApproved: number;
  thisWeekPlans: number;
  avgApprovalTime: number;
}

interface ChiefDashboardProps {
  userId: string;
}

const ChiefDashboard = ({ userId }: ChiefDashboardProps) => {
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["chief-dashboard", userId],
    queryFn: async () => {
      const res = await fetch(`/api/chief/meal-plans`);
      if (!res.ok) throw new Error("Failed to fetch data");
      return res.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = response?.stats || {};
  const userBranch = response?.userBranch;
  const recentPlans = response?.mealPlans?.slice(0, 3) || [];

  const statCards = [
    {
      title: "Total Meal Plans",
      value: stats?.totalMealPlans || 0,
      change: "+12%",
      changeType: "positive",
      icon: BarChart3,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
    },
    {
      title: "Pending Approval",
      value: stats?.pendingApproval || 0,
      change: "-5%",
      changeType: "positive",
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-100",
      iconBg: "bg-amber-500",
    },
    {
      title: "Approved This Month",
      value: stats?.approved || 0,
      change: "+18%",
      changeType: "positive",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-100",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Success Rate",
      value: stats?.totalMealPlans > 0 ? Math.round(((stats?.approved || 0) / stats?.totalMealPlans) * 100) : 0,
      suffix: "%",
      change: "+8%",
      changeType: "positive",
      icon: TrendingUp,
      gradient: "from-purple-500 to-violet-600",
      bgGradient: "from-purple-50 to-violet-100",
      iconBg: "bg-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-white/60 rounded-2xl w-96"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-white/60 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 bg-white/60 rounded-2xl"></div>
              <div className="h-80 bg-white/60 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section }
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Chief Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">Manage your meal plans and track approvals</p>
                </div>
              </div>
              {userBranch ? (
                <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">Branch: {userBranch.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-full border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-800 font-medium">No Branch Assigned</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.href = '/chief/meal-calendar'}
                className="group flex items-center gap-3 px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <Eye className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="font-medium text-gray-700 group-hover:text-blue-700">View Calendar</span>
              </button>
              <button
                onClick={() => window.location.href = '/chief/meal-plan'}
                className="group flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Create Meal Plan</span>
                <Sparkles className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${card.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {card.change && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        card.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {card.change}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-gray-900">
                      {card.value}{card.suffix || ''}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid }
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions }
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/chief/meal-plan'}
                className="group w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
              >
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-green-800">Create New Meal Plan</p>
                  <p className="text-sm text-gray-600">Design weekly meals for your branch</p>
                </div>
                <Plus className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-300" />
              </button>
              
              <button
                onClick={() => window.location.href = '/chief/meal-calendar'}
                className="group w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
              >
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-purple-800">View Meal Calendar</p>
                  <p className="text-sm text-gray-600">Check approved meal schedules</p>
                </div>
                <Eye className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Guidelines & Info }
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Approval Guidelines</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Dual Approval Required</p>
                  <p className="text-sm text-green-700">Both Support Director and Doctor must approve</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <Timer className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Auto-Approval Timer</p>
                  <p className="text-sm text-amber-700">Plans auto-approve after 5 hours if no action</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">Detailed Information</p>
                  <p className="text-sm text-blue-700">Include ingredients and allergen details</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-800">Branch-Based Review</p>
                  <p className="text-sm text-purple-700">Only your branch staff can review plans</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Plans }
        {recentPlans.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Recent Meal Plans</h3>
              </div>
              <button
                onClick={() => window.location.href = '/chief/meal-calendar'}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentPlans.map((plan: any) => (
                <div key={plan.id} className="group p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 truncate">{plan.title}</h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.status === 'APPROVED' || plan.status === 'AUTO_APPROVED' 
                        ? 'bg-green-100 text-green-700'
                        : plan.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {plan.status.replace('_', ' ')}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(plan.weekStartDate).toLocaleDateString()} - {new Date(plan.weekEndDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {plan.meals?.length || 0} meals planned
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChiefDashboard;

*/