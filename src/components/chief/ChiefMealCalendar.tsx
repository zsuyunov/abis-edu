/*
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Utensils,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Sparkles
} from "lucide-react";

interface MealPlan {
  id: number;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";
  createdAt: string;
  meals: {
    id: number;
    day: string;
    mealType: "LUNCH" | "SNACK";
    recipeTitle: string;
    description?: string;
    ingredients: string[];
    allergens: string[];
    calories?: number;
  }[];
  approvals: {
    id: number;
    status: "APPROVED" | "REJECTED";
    comment?: string;
    approverType: "DOCTOR" | "SUPPORT_DIRECTOR";
    approvedAt: string;
    approver: {
      firstName: string;
      lastName: string;
    };
  }[];
}

interface ChiefMealCalendarProps {
  userId: string;
}

const ChiefMealCalendar = ({ userId }: ChiefMealCalendarProps) => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"week" | "month">("week");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["chief-meal-calendar", userId, statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/chief/meal-plans?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch meal plans");
      return res.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const mealPlans = response?.mealPlans || [];
  const userBranch = response?.userBranch;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/chief/meal-plans?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete meal plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chief-meal-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["chief-dashboard"] });
      alert("Meal plan deleted successfully!");
    },
    onError: (error) => {
      alert("Failed to delete meal plan: " + error.message);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "AUTO_APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "PENDING_APPROVAL":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "AUTO_APPROVED":
        return "bg-green-50 text-green-700 border-green-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      case "PENDING_APPROVAL":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewType === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    if (viewType === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header }
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Meal Calendar
                  </h1>
                  <p className="text-gray-600">View and manage approved meal plans</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="AUTO_APPROVED">Auto Approved</option>
                <option value="PENDING_APPROVAL">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

      {/* Date Navigation }
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <button
          onClick={() => navigateDate("prev")}
          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">{formatDateRange()}</h2>
          <p className="text-sm text-gray-600">
            {mealPlans?.length || 0} meal plan{(mealPlans?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={() => navigateDate("next")}
          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Meal Plans Grid }
      {mealPlans && mealPlans.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mealPlans.map((plan: MealPlan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Plan Header }
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{plan.title}</h3>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
                    {getStatusIcon(plan.status)}
                    {plan.status.replace('_', ' ')}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(plan.weekStartDate).toLocaleDateString()} - {new Date(plan.weekEndDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Meals }
              <div className="p-4">
                <div className="space-y-3">
                  {plan.meals.map((meal: any) => (
                    <div key={meal.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Utensils className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {meal.day}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            meal.mealType === 'LUNCH' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {meal.mealType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium">{meal.recipeTitle}</p>
                        {meal.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{meal.description}</p>
                        )}
                        {meal.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {meal.allergens.slice(0, 3).map((allergen: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                {allergen}
                              </span>
                            ))}
                            {meal.allergens.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{meal.allergens.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approvals }
              {plan.approvals.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Approvals:</p>
                    <div className="space-y-1">
                      {plan.approvals.map((approval: any) => (
                        <div key={approval.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {approval.approver.firstName} {approval.approver.lastName} ({approval.approverType})
                          </span>
                          <div className={`flex items-center gap-1 ${
                            approval.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {approval.status === 'APPROVED' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {approval.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Meal Plans Found</h3>
            <p className="text-gray-600 mb-6">
              No approved meal plans found for the selected period. Create a new meal plan to get started.
            </p>
            <button
              onClick={() => window.location.href = '/chief/meal-plan'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              <Utensils className="w-4 h-4" />
              Create Meal Plan
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ChiefMealCalendar;

*/