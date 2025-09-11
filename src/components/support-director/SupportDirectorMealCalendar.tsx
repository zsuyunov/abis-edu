/*
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChefHat
} from "lucide-react";

interface Meal {
  id: number;
  day: string;
  mealType: string;
  recipeTitle: string;
  description: string | null;
  ingredients: string[];
  allergens: string[];
  calories: number | null;
  preparationTime: number | null;
  servingSize: string | null;
}

interface MealPlan {
  id: number;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  meals: Meal[];
  approvals: Array<{
    approverType: string;
    status: string;
    comment: string | null;
    approver: {
      firstName: string;
      lastName: string;
      position: string;
    };
  }>;
}

interface SupportDirectorMealCalendarProps {
  userId: string;
}

const SupportDirectorMealCalendar = ({ userId }: SupportDirectorMealCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);

  const { data: mealPlans, isLoading } = useQuery<MealPlan[]>({
    queryKey: ["support-director-meal-calendar", userId, currentDate, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId,
        date: currentDate.toISOString(),
        status: statusFilter,
        viewMode
      });
      const response = await fetch(`/api/support-director/meal-calendar?${params}`);
      if (!response.ok) throw new Error("Failed to fetch meal calendar");
      return response.json();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "PENDING_APPROVAL":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "AUTO_APPROVED":
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "AUTO_APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
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
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header }
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meal Calendar</h1>
            <p className="text-gray-600">View and monitor all meal plans</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="AUTO_APPROVED">Auto-Approved</option>
          </select>
          <div className="flex items-center bg-white border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === "week" 
                  ? "bg-purple-600 text-white" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                viewMode === "month" 
                  ? "bg-purple-600 text-white" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigation }
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">{formatDateRange()}</h2>
            <p className="text-sm text-gray-600 capitalize">{viewMode} view</p>
          </div>
          <button
            onClick={() => navigateDate("next")}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Meal Plans Grid }
      {mealPlans && mealPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mealPlans.map((mealPlan) => {
            const doctorApproval = mealPlan.approvals.find(a => a.approverType === "DOCTOR");
            const supportDirectorApproval = mealPlan.approvals.find(a => a.approverType === "SUPPORT_DIRECTOR");
            
            return (
              <div key={mealPlan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{mealPlan.title}</h3>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(mealPlan.status)}`}>
                        {getStatusIcon(mealPlan.status)}
                        {mealPlan.status.replace('_', ' ')}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMealPlan(mealPlan)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(mealPlan.weekStartDate).toLocaleDateString()} - {new Date(mealPlan.weekEndDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ChefHat className="w-4 h-4" />
                      <span>{mealPlan.meals.length} meals planned</span>
                    </div>
                  </div>

                  {/* Approval Status }
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Approval Status</h4>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${doctorApproval?.status === 'APPROVED' ? 'bg-green-500' : doctorApproval?.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-600">Doctor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${supportDirectorApproval?.status === 'APPROVED' ? 'bg-green-500' : supportDirectorApproval?.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-600">Support Director</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created by {mealPlan.createdBy.firstName} {mealPlan.createdBy.lastName} • {new Date(mealPlan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Meal Plans Found</h3>
            <p className="text-gray-600 mb-6">
              No meal plans found for the selected period and filters. Check different dates or adjust your filters.
            </p>
          </div>
        </div>
      )}

      {/* Meal Plan Detail Modal }
      {selectedMealPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedMealPlan.title}</h2>
                <p className="text-sm text-gray-600">
                  {new Date(selectedMealPlan.weekStartDate).toLocaleDateString()} - {new Date(selectedMealPlan.weekEndDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMealPlan(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Status and Approvals }
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedMealPlan.status)}`}>
                    {getStatusIcon(selectedMealPlan.status)}
                    {selectedMealPlan.status.replace('_', ' ')}
                  </div>
                  <span className="text-sm text-gray-600">
                    Created by {selectedMealPlan.createdBy.firstName} {selectedMealPlan.createdBy.lastName}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedMealPlan.approvals.map((approval, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium text-gray-900">{approval.approverType.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">{approval.approver.firstName} {approval.approver.lastName}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          approval.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          approval.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {approval.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> :
                           approval.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          {approval.status}
                        </div>
                        {approval.comment && (
                          <p className="text-xs text-gray-500 mt-1 max-w-32 truncate" title={approval.comment}>
                            "{approval.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meals }
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Meal Details</h3>
                {selectedMealPlan.meals.map((meal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {meal.day}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {meal.mealType}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{meal.recipeTitle}</h4>
                    {meal.description && (
                      <p className="text-gray-600 text-sm mb-3">{meal.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Ingredients:</h5>
                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                          {meal.ingredients.map((ingredient, i) => (
                            <li key={i}>{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Allergens:</h5>
                        {meal.allergens.length > 0 ? (
                          <ul className="list-disc list-inside text-red-600 space-y-1">
                            {meal.allergens.map((allergen, i) => (
                              <li key={i}>{allergen}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">No allergens listed</p>
                        )}
                      </div>
                    </div>
                    {(meal.calories || meal.preparationTime || meal.servingSize) && (
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200 text-sm">
                        {meal.calories && (
                          <div>
                            <span className="font-medium text-gray-700">Calories:</span>
                            <p className="text-gray-600">{meal.calories}</p>
                          </div>
                        )}
                        {meal.preparationTime && (
                          <div>
                            <span className="font-medium text-gray-700">Prep Time:</span>
                            <p className="text-gray-600">{meal.preparationTime} min</p>
                          </div>
                        )}
                        {meal.servingSize && (
                          <div>
                            <span className="font-medium text-gray-700">Serving:</span>
                            <p className="text-gray-600">{meal.servingSize}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDirectorMealCalendar;

*/