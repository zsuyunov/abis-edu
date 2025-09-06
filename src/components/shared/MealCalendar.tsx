"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
  autoApprovedAt: string | null;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  meals: Meal[];
}

interface MealCalendarProps {
  userRole: "chief" | "doctor" | "support_director";
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const MEAL_TYPES = ["LUNCH", "SNACK"];

const MealCalendar: React.FC<MealCalendarProps> = ({ userRole }) => {
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Get current week start (Monday)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Calculate week end date
  const weekEndDate = new Date(selectedWeek);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const { data: mealPlans, isLoading } = useQuery<MealPlan[]>({
    queryKey: ["meal-calendar", selectedWeek],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: selectedWeek,
        endDate: weekEndDate.toISOString().split('T')[0],
      });
      const response = await fetch(`/api/meal-calendar?${params}`);
      if (!response.ok) throw new Error("Failed to fetch meal calendar");
      return response.json();
    },
  });

  const goToPreviousWeek = () => {
    const currentWeek = new Date(selectedWeek);
    currentWeek.setDate(currentWeek.getDate() - 7);
    setSelectedWeek(currentWeek.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const currentWeek = new Date(selectedWeek);
    currentWeek.setDate(currentWeek.getDate() + 7);
    setSelectedWeek(currentWeek.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    setSelectedWeek(monday.toISOString().split('T')[0]);
  };

  const formatWeekRange = () => {
    const start = new Date(selectedWeek);
    const end = new Date(selectedWeek);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const getMealForDayAndType = (day: string, mealType: string): Meal | null => {
    if (!mealPlans) return null;
    
    for (const plan of mealPlans) {
      const meal = plan.meals.find(m => m.day === day && m.mealType === mealType);
      if (meal) return meal;
    }
    return null;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "AUTO_APPROVED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Meal Calendar</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousWeek}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            ← Previous Week
          </button>
          <div className="text-center">
            <div className="font-medium text-gray-800">{formatWeekRange()}</div>
            <button
              onClick={goToCurrentWeek}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Go to Current Week
            </button>
          </div>
          <button
            onClick={goToNextWeek}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-6 bg-gray-50">
          <div className="p-4 font-semibold text-gray-800 border-r border-gray-200">
            Meal Type
          </div>
          {DAYS.map(day => (
            <div key={day} className="p-4 font-semibold text-gray-800 border-r border-gray-200 last:border-r-0 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Meal Rows */}
        {MEAL_TYPES.map(mealType => (
          <div key={mealType} className="grid grid-cols-6 border-b border-gray-200 last:border-b-0">
            <div className="p-4 bg-gray-50 border-r border-gray-200 font-medium text-gray-700 flex items-center">
              {mealType}
            </div>
            {DAYS.map(day => {
              const meal = getMealForDayAndType(day, mealType);
              return (
                <div key={`${day}-${mealType}`} className="p-4 border-r border-gray-200 last:border-r-0 min-h-[120px]">
                  {meal ? (
                    <div
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors h-full"
                      onClick={() => setSelectedMeal(meal)}
                    >
                      <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">
                        {meal.recipeTitle}
                      </h4>
                      <div className="space-y-1">
                        {meal.calories && (
                          <p className="text-xs text-gray-600">{meal.calories} cal</p>
                        )}
                        {meal.allergens.length > 0 && (
                          <p className="text-xs text-red-600">
                            ⚠ {meal.allergens.slice(0, 2).join(", ")}
                            {meal.allergens.length > 2 && " +more"}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      No meal planned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Week Summary */}
      {mealPlans && mealPlans.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">This Week's Meal Plans</h3>
          {mealPlans.map(plan => (
            <div key={plan.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-800">{plan.title}</h4>
                  <p className="text-sm text-gray-600">
                    By {plan.createdBy.firstName} {plan.createdBy.lastName}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(plan.status)}`}>
                  {plan.status.replace('_', ' ')}
                  {plan.autoApprovedAt && " (Auto)"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {plan.meals.length} meals planned
              </p>
            </div>
          ))}
        </div>
      )}

      {mealPlans && mealPlans.length === 0 && (
        <div className="mt-6 bg-white rounded-lg p-8 text-center shadow-sm">
          <span className="text-6xl mb-4 block">📅</span>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Meals Planned</h3>
          <p className="text-gray-600">
            {userRole === "chief" 
              ? "No meal plans have been approved for this week. Create a new meal plan to get started."
              : "No meal plans have been approved for this week. Check back later for updates."
            }
          </p>
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedMeal.recipeTitle}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {selectedMeal.day}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      {selectedMeal.mealType}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedMeal.description && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedMeal.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Ingredients</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {selectedMeal.ingredients.map((ingredient, i) => (
                      <li key={i}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Allergens</h3>
                  {selectedMeal.allergens.length > 0 ? (
                    <ul className="list-disc list-inside text-red-600 space-y-1">
                      {selectedMeal.allergens.map((allergen, i) => (
                        <li key={i}>{allergen}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No allergens listed</p>
                  )}
                </div>
              </div>

              {(selectedMeal.calories || selectedMeal.preparationTime || selectedMeal.servingSize) && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  {selectedMeal.calories && (
                    <div className="text-center">
                      <p className="font-medium text-gray-800">Calories</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedMeal.calories}</p>
                    </div>
                  )}
                  {selectedMeal.preparationTime && (
                    <div className="text-center">
                      <p className="font-medium text-gray-800">Prep Time</p>
                      <p className="text-2xl font-bold text-green-600">{selectedMeal.preparationTime} min</p>
                    </div>
                  )}
                  {selectedMeal.servingSize && (
                    <div className="text-center">
                      <p className="font-medium text-gray-800">Serving Size</p>
                      <p className="text-lg font-bold text-purple-600">{selectedMeal.servingSize}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealCalendar;
