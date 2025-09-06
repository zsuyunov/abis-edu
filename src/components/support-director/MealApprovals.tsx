"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

const MealApprovals = () => {
  const queryClient = useQueryClient();
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [approvalAction, setApprovalAction] = useState<"APPROVED" | "REJECTED" | null>(null);

  const { data: mealPlans, isLoading } = useQuery<MealPlan[]>({
    queryKey: ["support-director-meal-approvals"],
    queryFn: async () => {
      const response = await fetch("/api/support-director/meal-approvals");
      if (!response.ok) throw new Error("Failed to fetch meal approvals");
      return response.json();
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ mealPlanId, status, comment }: { mealPlanId: number; status: string; comment?: string }) => {
      const response = await fetch("/api/support-director/meal-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId, status, comment }),
      });
      if (!response.ok) throw new Error("Failed to process approval");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-director-meal-approvals"] });
      setSelectedMealPlan(null);
      setApprovalComment("");
      setApprovalAction(null);
      alert("Approval processed successfully!");
    },
    onError: (error) => {
      alert("Failed to process approval: " + error.message);
    },
  });

  const handleApproval = (action: "APPROVED" | "REJECTED") => {
    if (!selectedMealPlan) return;

    if (action === "REJECTED" && !approvalComment.trim()) {
      alert("Please provide a comment for rejection");
      return;
    }

    approvalMutation.mutate({
      mealPlanId: selectedMealPlan.id,
      status: action,
      comment: approvalComment.trim() || undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeSinceCreation = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffInHours >= 1) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  };

  const getAutoApprovalCountdown = (createdAt: string) => {
    const created = new Date(createdAt);
    const autoApprovalTime = new Date(created.getTime() + 5 * 60 * 60 * 1000); // 5 hours
    const now = new Date();
    const timeLeft = autoApprovalTime.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return "Auto-approval overdue";
    }

    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return `Auto-approves in ${hoursLeft}h ${minutesLeft}m`;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Meal Plan Approvals</h1>
        <span className="text-sm text-gray-500">
          {mealPlans?.length || 0} pending approval{mealPlans?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {mealPlans && mealPlans.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <span className="text-6xl mb-4 block">📋</span>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Pending Approvals</h3>
          <p className="text-gray-600">All meal plans have been processed. Check back later for new submissions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mealPlans?.map((mealPlan) => {
            const supportDirectorHasApproved = mealPlan.approvals.some(
              approval => approval.approverType === "SUPPORT_DIRECTOR"
            );
            const doctorApproval = mealPlan.approvals.find(
              approval => approval.approverType === "DOCTOR"
            );

            return (
              <div key={mealPlan.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{mealPlan.title}</h3>
                      <p className="text-sm text-gray-600">
                        By {mealPlan.createdBy.firstName} {mealPlan.createdBy.lastName} • {getTimeSinceCreation(mealPlan.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                        {mealPlan.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {getAutoApprovalCountdown(mealPlan.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Week Period</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(mealPlan.weekStartDate)} - {formatDate(mealPlan.weekEndDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total Meals</p>
                      <p className="text-sm text-gray-600">{mealPlan.meals.length} meals planned</p>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Approval Status</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${doctorApproval ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm text-gray-600">Doctor</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${supportDirectorHasApproved ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm text-gray-600">Support Director</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedMealPlan(mealPlan)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    {!supportDirectorHasApproved && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedMealPlan(mealPlan);
                            setApprovalAction("APPROVED");
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMealPlan(mealPlan);
                            setApprovalAction("REJECTED");
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for meal plan details and approval */}
      {selectedMealPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedMealPlan.title}
                </h2>
                <button
                  onClick={() => {
                    setSelectedMealPlan(null);
                    setApprovalAction(null);
                    setApprovalComment("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Meal Details */}
              <div className="space-y-6 mb-6">
                {selectedMealPlan.meals.map((meal, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {meal.day}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {meal.mealType}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">{meal.recipeTitle}</h4>
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

              {/* Approval Actions */}
              {approvalAction && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {approvalAction === "APPROVED" ? "Approve Meal Plan" : "Reject Meal Plan"}
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment {approvalAction === "REJECTED" ? "(Required)" : "(Optional)"}
                    </label>
                    <textarea
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder={
                        approvalAction === "REJECTED" 
                          ? "Please explain why this meal plan is being rejected..."
                          : "Optional comments about the meal plan..."
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval(approvalAction)}
                      disabled={approvalMutation.isPending}
                      className={`px-4 py-2 rounded-md text-white transition-colors ${
                        approvalAction === "APPROVED"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      } disabled:bg-gray-400`}
                    >
                      {approvalMutation.isPending ? "Processing..." : `Confirm ${approvalAction.toLowerCase()}`}
                    </button>
                    <button
                      onClick={() => {
                        setApprovalAction(null);
                        setApprovalComment("");
                      }}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!approvalAction && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setApprovalAction("APPROVED")}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setApprovalAction("REJECTED")}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealApprovals;
