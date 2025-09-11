/*
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Stethoscope, 
  ClipboardCheck, 
  Calendar, 
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
  Activity,
  FileCheck,
  UserCheck
} from "lucide-react";

interface DoctorStats {
  pendingApprovals: number;
  totalApproved: number;
  totalRejected: number;
  thisWeekApprovals: number;
  avgApprovalTime: number;
}

interface DoctorDashboardProps {
  userId: string;
}

const DoctorDashboard = ({ userId }: DoctorDashboardProps) => {
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["doctor-dashboard", userId],
    queryFn: async () => {
      const res = await fetch(`/api/doctor/meal-approvals`);
      if (!res.ok) throw new Error("Failed to fetch data");
      return res.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = response?.stats || {};
  const userBranch = response?.userBranch;
  const recentApprovals = response?.recentApprovals?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
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

  const statCards = [
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      change: "+2 today",
      changeType: "neutral",
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-100",
      iconBg: "bg-amber-500",
    },
    {
      title: "Total Approved",
      value: stats?.totalApproved || 0,
      change: "+12 this week",
      changeType: "positive",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-100",
      iconBg: "bg-emerald-500",
    },
    {
      title: "Total Rejected",
      value: stats?.totalRejected || 0,
      change: "+1 this week",
      changeType: "negative",
      icon: XCircle,
      gradient: "from-red-500 to-rose-600",
      bgGradient: "from-red-50 to-rose-100",
      iconBg: "bg-red-500",
    },
    {
      title: "Approval Rate",
      value: stats?.totalApproved > 0 ? Math.round(((stats?.totalApproved || 0) / ((stats?.totalApproved || 0) + (stats?.totalRejected || 0))) * 100) : 0,
      suffix: "%",
      change: "+5%",
      changeType: "positive",
      icon: TrendingUp,
      gradient: "from-purple-500 to-violet-600",
      bgGradient: "from-purple-50 to-violet-100",
      iconBg: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header }
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Doctor Dashboard
                </h1>
                <p className="text-green-600 font-medium">Medical Review & Approval Center</p>
              </div>
            </div>
          </div>
          
          {userBranch && (
            <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Branch: {userBranch.name}</span>
            </div>
          )}
        </div>

        {/* Stats Cards }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className={`relative overflow-hidden bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {card.value}
                        </span>
                        {card.suffix && (
                          <span className="text-lg font-semibold text-gray-700">{card.suffix}</span>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 ${card.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 
                    card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {card.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions & Recent Activity }
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions }
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.href = '/doctor/meal-approvals'}
                className="w-full group p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">Review Meal Plans</p>
                    <p className="text-sm text-gray-600">Approve or reject pending meal plans</p>
                  </div>
                  <div className="ml-auto">
                    <Plus className="w-5 h-5 text-green-600 group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/doctor/meal-calendar'}
                className="w-full group p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 group-hover:text-emerald-700">View Meal Calendar</p>
                    <p className="text-sm text-gray-600">See approved meal plans</p>
                  </div>
                  <div className="ml-auto">
                    <Eye className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/doctor/analytics'}
                className="w-full group p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 group-hover:text-purple-700">View Analytics</p>
                    <p className="text-sm text-gray-600">Track approval patterns & trends</p>
                  </div>
                  <div className="ml-auto">
                    <TrendingUp className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Approval Guidelines }
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Medical Guidelines</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="p-2 bg-green-500 rounded-lg">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Nutritional Balance</p>
                  <p className="text-sm text-gray-600">Ensure meals provide proper nutrition for student health</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Allergen Safety</p>
                  <p className="text-sm text-gray-600">Check for common allergens and safety protocols</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Health Standards</p>
                  <p className="text-sm text-gray-600">Verify meals meet medical health requirements</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-approval Notice }
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-blue-800">Auto-Approval System</h4>
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-blue-700 leading-relaxed">
                Meal plans that are not reviewed within <span className="font-semibold">5 hours</span> will be automatically approved 
                and appear on the meal calendar. This ensures continuous meal service for students while maintaining medical oversight.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

*/