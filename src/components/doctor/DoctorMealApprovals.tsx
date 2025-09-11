/*
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Users,
  Utensils,
  AlertTriangle,
  MessageSquare,
  Filter,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Stethoscope,
  Shield,
  FileText,
  User
} from "lucide-react";

interface MealPlan {
  id: number;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  branch: {
    shortName?: string;
    legalName?: string;
  };
  meals: {
    id: number;
    day: string;
    mealType: "LUNCH" | "SNACK";
    recipeTitle: string;
    description?: string;
    ingredients: string[];
    allergens: string[];
    calories?: number;
    preparationTime?: number;
    servingSize?: string;
  }[];
  approvals: {
    id: number;
    status: "APPROVED" | "REJECTED";
    comment?: string;
    approverType: "DOCTOR" | "SUPPORT_DIRECTOR";
    createdAt: string;
    approver: {
      firstName: string;
      lastName: string;
    };
  }[];
}

interface DoctorMealApprovalsProps {
  userId: string;
}

const DoctorMealApprovals = ({ userId }: DoctorMealApprovalsProps) => {
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  
  const queryClient = useQueryClient();

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["doctor-meal-approvals", userId],
    queryFn: async () => {
      const res = await fetch(`/api/doctor/meal-approvals`);
      if (!res.ok) throw new Error("Failed to fetch meal approvals");
      return res.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const mealPlans = response?.mealPlans || [];
  const stats = response?.stats || {};
  const userBranch = response?.userBranch;

  const approvalMutation = useMutation({
    mutationFn: async ({ mealPlanId, status, comment }: { 
      mealPlanId: number; 
      status: "APPROVED" | "REJECTED"; 
      comment?: string 
    }) => {
      const res = await fetch(`/api/doctor/meal-approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId, status, comment }),
      });
      if (!res.ok) throw new Error("Failed to process approval");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-meal-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard"] });
      setSelectedPlan(null);
      setApprovalComment("");
      refetch();
    },
  });

  const handleApproval = (status: "APPROVED" | "REJECTED") => {
    if (!selectedPlan) return;
    
    if (status === "REJECTED" && !approvalComment.trim()) {
      alert("Please provide a comment for rejection");
      return;
    }

    approvalMutation.mutate({
      mealPlanId: selectedPlan.id,
      status,
      comment: approvalComment.trim() || undefined,
    });
  };

  const filteredPlans = mealPlans.filter((plan: MealPlan) =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.createdBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.createdBy.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-white/60 rounded-2xl w-96"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-white/60 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header }
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <ClipboardCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Meal Plan Approvals
                </h1>
                <p className="text-green-600 font-medium">Medical review and approval center</p>
              </div>
            </div>
          </div>
          
          {userBranch && (
            <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-green-800 font-medium">Branch: {userBranch.name}</span>
            </div>
          )}
        </div>

        {/* Stats Cards }
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Pending Reviews</p>
                <p className="text-3xl font-bold text-amber-900">{stats.pendingApprovals || 0}</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Total Approved</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.totalApproved || 0}</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-rose-100 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.totalRejected || 0}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter }
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search meal plans, creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "title")}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        {/* Meal Plans Grid }
        {sortedPlans.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedPlans.map((plan: MealPlan) => (
              <div key={plan.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {/* Plan Header }
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg">{plan.title}</h3>
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      PENDING
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(plan.weekStartDate).toLocaleDateString()} - {new Date(plan.weekEndDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Created by: {plan.createdBy.firstName} {plan.createdBy.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Branch: {plan.branch?.shortName || plan.branch?.legalName}</span>
                    </div>
                  </div>
                </div>

                {/* Meals Preview }
                <div className="p-6">
                  <div className="space-y-3">
                    {plan.meals.slice(0, 2).map((meal) => (
                      <div key={meal.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <Utensils className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{meal.day}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {meal.mealType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium">{meal.recipeTitle}</p>
                          {meal.allergens.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-red-600">
                                {meal.allergens.length} allergen{meal.allergens.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {plan.meals.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{plan.meals.length - 2} more meals
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions }
                <div className="p-6 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Review & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardCheck className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Pending Approvals</h3>
              <p className="text-gray-600">
                All meal plans have been reviewed. Great work maintaining student health standards!
              </p>
            </div>
          </div>
        )}

        {/* Review Modal }
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header }
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.title}</h2>
                      <p className="text-green-600">Medical Review Required</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content }
              <div className="p-6 space-y-6">
                {/* Plan Details }
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-2">Plan Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Period:</span>
                          <span className="font-medium">
                            {new Date(selectedPlan.weekStartDate).toLocaleDateString()} - 
                            {new Date(selectedPlan.weekEndDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created by:</span>
                          <span className="font-medium">
                            {selectedPlan.createdBy.firstName} {selectedPlan.createdBy.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Meals:</span>
                          <span className="font-medium">{selectedPlan.meals.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-2">Health Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Allergen Warnings:</span>
                          <span className="font-medium text-red-600">
                            {selectedPlan.meals.reduce((acc, meal) => acc + meal.allergens.length, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Calories:</span>
                          <span className="font-medium">
                            {Math.round(selectedPlan.meals.reduce((acc, meal) => acc + (meal.calories || 0), 0) / selectedPlan.meals.length) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meals Detail }
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Detailed Meal Review</h4>
                  <div className="space-y-4">
                    {selectedPlan.meals.map((meal) => (
                      <div key={meal.id} className="border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{meal.day}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {meal.mealType}
                              </span>
                              {meal.calories && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  {meal.calories} cal
                                </span>
                              )}
                            </div>
                            <h5 className="font-semibold text-gray-900">{meal.recipeTitle}</h5>
                            {meal.description && (
                              <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h6 className="font-medium text-gray-900 mb-2">Ingredients</h6>
                            <div className="space-y-1">
                              {meal.ingredients.map((ingredient, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span className="text-gray-700">{ingredient}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {meal.allergens.length > 0 && (
                            <div>
                              <h6 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Allergens
                              </h6>
                              <div className="space-y-1">
                                {meal.allergens.map((allergen, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                    <span className="text-red-700 font-medium">{allergen}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment Section }
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Review Comment (Required for rejection)
                  </label>
                  <textarea
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Provide medical feedback, nutritional concerns, or approval notes..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons }
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleApproval("APPROVED")}
                    disabled={approvalMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {approvalMutation.isPending ? "Processing..." : "Approve Plan"}
                  </button>
                  
                  <button
                    onClick={() => handleApproval("REJECTED")}
                    disabled={approvalMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 px-6 rounded-xl font-medium hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    {approvalMutation.isPending ? "Processing..." : "Reject Plan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorMealApprovals;

*/