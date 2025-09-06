"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Meal {
  id?: string;
  day: string;
  mealType: "LUNCH" | "SNACK";
  recipeTitle: string;
  description?: string;
  ingredients: string[];
  allergens: string[];
  calories?: number;
  preparationTime?: number;
  servingSize?: string;
}

interface MealPlan {
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  meals: Meal[];
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const MEAL_TYPES = ["LUNCH", "SNACK"];

const MealPlanCreation = () => {
  const queryClient = useQueryClient();
  const [mealPlan, setMealPlan] = useState<MealPlan>({
    title: "",
    weekStartDate: "",
    weekEndDate: "",
    meals: []
  });

  const [currentMeal, setCurrentMeal] = useState<Meal>({
    day: "MONDAY",
    mealType: "LUNCH",
    recipeTitle: "",
    description: "",
    ingredients: [""],
    allergens: [""],
    calories: undefined,
    preparationTime: undefined,
    servingSize: ""
  });

  const [showMealForm, setShowMealForm] = useState(false);

  const createMealPlanMutation = useMutation({
    mutationFn: async (mealPlan: MealPlan) => {
      const response = await fetch("/api/chief/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealPlan),
      });
      if (!response.ok) throw new Error("Failed to create meal plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
      setMealPlan({
        title: "",
        weekStartDate: "",
        weekEndDate: "",
        meals: []
      });
      alert("Meal plan created successfully and submitted for approval!");
    },
    onError: (error) => {
      alert("Failed to create meal plan: " + error.message);
    },
  });

  const addIngredient = () => {
    setCurrentMeal(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ""]
    }));
  };

  const removeIngredient = (index: number) => {
    setCurrentMeal(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setCurrentMeal(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) => i === index ? value : item)
    }));
  };

  const addAllergen = () => {
    setCurrentMeal(prev => ({
      ...prev,
      allergens: [...prev.allergens, ""]
    }));
  };

  const removeAllergen = (index: number) => {
    setCurrentMeal(prev => ({
      ...prev,
      allergens: prev.allergens.filter((_, i) => i !== index)
    }));
  };

  const updateAllergen = (index: number, value: string) => {
    setCurrentMeal(prev => ({
      ...prev,
      allergens: prev.allergens.map((item, i) => i === index ? value : item)
    }));
  };

  const addMealToPlan = () => {
    const cleanedMeal = {
      ...currentMeal,
      ingredients: currentMeal.ingredients.filter(ing => ing.trim() !== ""),
      allergens: currentMeal.allergens.filter(all => all.trim() !== "")
    };

    if (!cleanedMeal.recipeTitle.trim()) {
      alert("Please enter a recipe title");
      return;
    }

    setMealPlan(prev => ({
      ...prev,
      meals: [...prev.meals, cleanedMeal]
    }));

    setCurrentMeal({
      day: "MONDAY",
      mealType: "LUNCH",
      recipeTitle: "",
      description: "",
      ingredients: [""],
      allergens: [""],
      calories: undefined,
      preparationTime: undefined,
      servingSize: ""
    });
    setShowMealForm(false);
  };

  const removeMealFromPlan = (index: number) => {
    setMealPlan(prev => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mealPlan.title.trim() || !mealPlan.weekStartDate || !mealPlan.weekEndDate) {
      alert("Please fill in all required fields");
      return;
    }

    if (mealPlan.meals.length === 0) {
      alert("Please add at least one meal to the plan");
      return;
    }

    createMealPlanMutation.mutate(mealPlan);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Create Weekly Meal Plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Title *
              </label>
              <input
                type="text"
                required
                value={mealPlan.title}
                onChange={(e) => setMealPlan(prev => ({...prev, title: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Week 1 - January 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Start Date *
              </label>
              <input
                type="date"
                required
                value={mealPlan.weekStartDate}
                onChange={(e) => setMealPlan(prev => ({...prev, weekStartDate: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week End Date *
              </label>
              <input
                type="date"
                required
                value={mealPlan.weekEndDate}
                onChange={(e) => setMealPlan(prev => ({...prev, weekEndDate: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Meals Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Meals ({mealPlan.meals.length})</h3>
            <button
              type="button"
              onClick={() => setShowMealForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Meal
            </button>
          </div>

          {/* Existing Meals */}
          {mealPlan.meals.length > 0 && (
            <div className="space-y-4 mb-6">
              {mealPlan.meals.map((meal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {meal.day}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {meal.mealType}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMealFromPlan(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{meal.recipeTitle}</h4>
                  {meal.description && (
                    <p className="text-gray-600 text-sm mb-2">{meal.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Ingredients:</span>
                      <ul className="list-disc list-inside text-gray-600 ml-2">
                        {meal.ingredients.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      {meal.allergens.length > 0 && (
                        <>
                          <span className="font-medium text-gray-700">Allergens:</span>
                          <ul className="list-disc list-inside text-red-600 ml-2">
                            {meal.allergens.map((all, i) => (
                              <li key={i}>{all}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Meal Form */}
          {showMealForm && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-4">Add New Meal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day *
                  </label>
                  <select
                    value={currentMeal.day}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, day: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type *
                  </label>
                  <select
                    value={currentMeal.mealType}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, mealType: e.target.value as "LUNCH" | "SNACK"}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MEAL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={currentMeal.recipeTitle}
                  onChange={(e) => setCurrentMeal(prev => ({...prev, recipeTitle: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chicken Fried Rice"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={currentMeal.description}
                  onChange={(e) => setCurrentMeal(prev => ({...prev, description: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detailed recipe description..."
                />
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                {currentMeal.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2 cups rice"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Ingredient
                </button>
              </div>

              {/* Allergens */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                {currentMeal.allergens.map((allergen, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={allergen}
                      onChange={(e) => updateAllergen(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., nuts, dairy"
                    />
                    <button
                      type="button"
                      onClick={() => removeAllergen(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAllergen}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Allergen
                </button>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={currentMeal.calories || ""}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, calories: e.target.value ? parseInt(e.target.value) : undefined}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 450"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    value={currentMeal.preparationTime || ""}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, preparationTime: e.target.value ? parseInt(e.target.value) : undefined}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serving Size
                  </label>
                  <input
                    type="text"
                    value={currentMeal.servingSize || ""}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, servingSize: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 250g"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addMealToPlan}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Meal
                </button>
                <button
                  type="button"
                  onClick={() => setShowMealForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <button
            type="submit"
            disabled={createMealPlanMutation.isPending || mealPlan.meals.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {createMealPlanMutation.isPending ? "Creating..." : "Submit Meal Plan for Approval"}
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Once submitted, the meal plan will be sent to Support Director and Doctor for approval.
            If not approved/rejected within 5 hours, it will be automatically approved.
          </p>
        </div>
      </form>
    </div>
  );
};

export default MealPlanCreation;
