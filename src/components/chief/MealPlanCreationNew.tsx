/*
"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Calendar, Clock, Users, ChefHat, X } from "lucide-react";

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
  mealAmount?: number;
  attachments?: File[];
}

interface MealPlan {
  id?: number;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  meals: Meal[];
  status?: string;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const MEAL_TYPES = ["LUNCH", "SNACK"];

interface MealPlanCreationProps {
  userId: string;
  editingPlanId?: number;
  onClose?: () => void;
}

const MealPlanCreation = ({ userId, editingPlanId, onClose }: MealPlanCreationProps) => {
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
    servingSize: "",
    mealAmount: undefined,
    attachments: []
  });

  const [showMealForm, setShowMealForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing meal plan if editing
  const { data: existingPlan } = useQuery({
    queryKey: ["meal-plan", editingPlanId],
    queryFn: async () => {
      if (!editingPlanId) return null;
      const response = await fetch(`/api/chief/meal-plans?id=${editingPlanId}`);
      if (!response.ok) throw new Error("Failed to fetch meal plan");
      const data = await response.json();
      return data.mealPlans?.[0];
    },
    enabled: !!editingPlanId,
  });

  // Load existing plan data when editing
  useEffect(() => {
    if (existingPlan && editingPlanId) {
      setMealPlan({
        id: existingPlan.id,
        title: existingPlan.title,
        weekStartDate: existingPlan.weekStartDate.split('T')[0],
        weekEndDate: existingPlan.weekEndDate.split('T')[0],
        meals: existingPlan.meals || [],
        status: existingPlan.status,
      });
      setIsEditing(true);
    }
  }, [existingPlan, editingPlanId]);

  const createMealPlanMutation = useMutation({
    mutationFn: async (mealPlan: MealPlan) => {
      const url = "/api/chief/meal-plans";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealPlan),
      });
      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} meal plan`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
      queryClient.invalidateQueries({ queryKey: ["chief-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["chief-meal-calendar"] });
      // Force refetch with specific user ID
      queryClient.refetchQueries({ queryKey: ["chief-dashboard"] });
      queryClient.refetchQueries({ queryKey: ["chief-meal-calendar"] });
      if (!isEditing) {
        setMealPlan({
          title: "",
          weekStartDate: "",
          weekEndDate: "",
          meals: []
        });
      }
      alert(`Meal plan ${isEditing ? 'updated' : 'created'} successfully and submitted for approval!`);
      if (onClose) onClose();
    },
    onError: (error) => {
      alert(`Failed to ${isEditing ? 'update' : 'create'} meal plan: ` + error.message);
    },
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/chief/meal-plans?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete meal plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
      queryClient.invalidateQueries({ queryKey: ["chief-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["chief-meal-calendar"] });
      alert("Meal plan deleted successfully!");
      if (onClose) onClose();
    },
    onError: (error) => {
      alert("Failed to delete meal plan: " + error.message);
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

  const handleDelete = () => {
    if (!mealPlan.id) return;
    if (confirm("Are you sure you want to delete this meal plan? This action cannot be undone.")) {
      deleteMealPlanMutation.mutate(mealPlan.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header }
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {isEditing ? 'Edit Meal Plan' : 'Create Weekly Meal Plan'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isEditing ? 'Update your meal plan details' : 'Design nutritious meals for your branch'}
              </p>
              {mealPlan.status && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  mealPlan.status === 'APPROVED' || mealPlan.status === 'AUTO_APPROVED' 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : mealPlan.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                  Status: {mealPlan.status.replace('_', ' ')}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 hover:shadow-lg"
                >
                  Cancel
                </button>
              )}
              {isEditing && mealPlan.id && (mealPlan.status === 'PENDING_APPROVAL' || mealPlan.status === 'REJECTED') && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMealPlanMutation.isPending}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                >
                  {deleteMealPlanMutation.isPending ? 'Deleting...' : 'Delete Plan'}
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information }
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Plan Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Plan Title *
                </label>
                <input
                  type="text"
                  required
                  value={mealPlan.title}
                  onChange={(e) => setMealPlan(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="e.g., Week of March 15-19"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Week Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={mealPlan.weekStartDate}
                  onChange={(e) => setMealPlan(prev => ({ ...prev, weekStartDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Week End Date *
                </label>
                <input
                  type="date"
                  required
                  value={mealPlan.weekEndDate}
                  onChange={(e) => setMealPlan(prev => ({ ...prev, weekEndDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Meals Section }
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Meals</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMealForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Meal
              </button>
            </div>

            {/* Existing Meals }
            {mealPlan.meals.length > 0 && (
              <div className="space-y-4 mb-6">
                {mealPlan.meals.map((meal, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {meal.day}
                        </span>
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {meal.mealType}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMealFromPlan(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2 text-lg">{meal.recipeTitle}</h4>
                    {meal.description && (
                      <p className="text-gray-600 mb-4">{meal.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Ingredients:</span>
                        <ul className="list-disc list-inside text-gray-600 ml-2 mt-1">
                          {meal.ingredients.map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        {meal.allergens.length > 0 && (
                          <>
                            <span className="font-semibold text-gray-700">Allergens:</span>
                            <ul className="list-disc list-inside text-red-600 ml-2 mt-1">
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

            {/* Add Meal Form }
            {showMealForm && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold text-gray-800">Add New Meal</h4>
                  <button
                    type="button"
                    onClick={() => setShowMealForm(false)}
                    className="p-2 hover:bg-white rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Day *
                    </label>
                    <select
                      value={currentMeal.day}
                      onChange={(e) => setCurrentMeal(prev => ({...prev, day: e.target.value}))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meal Type *
                    </label>
                    <select
                      value={currentMeal.mealType}
                      onChange={(e) => setCurrentMeal(prev => ({...prev, mealType: e.target.value as "LUNCH" | "SNACK"}))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MEAL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipe Title *
                  </label>
                  <input
                    type="text"
                    value={currentMeal.recipeTitle}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, recipeTitle: e.target.value}))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Chicken Fried Rice"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={currentMeal.description}
                    onChange={(e) => setCurrentMeal(prev => ({...prev, description: e.target.value}))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Detailed recipe description..."
                  />
                </div>

                {/* Ingredients }
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ingredients
                  </label>
                  {currentMeal.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 2 cups rice"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                  >
                    + Add Ingredient
                  </button>
                </div>

                {/* Nutrition & Preparation Info }
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={currentMeal.calories || ""}
                      onChange={(e) => setCurrentMeal(prev => ({...prev, calories: e.target.value ? parseInt(e.target.value) : undefined}))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prep Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={currentMeal.preparationTime || ""}
                      onChange={(e) => setCurrentMeal(prev => ({...prev, preparationTime: e.target.value ? parseInt(e.target.value) : undefined}))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meal Amount (servings)
                    </label>
                    <input
                      type="number"
                      value={currentMeal.mealAmount || ""}
                      onChange={(e) => setCurrentMeal(prev => ({...prev, mealAmount: e.target.value ? parseInt(e.target.value) : undefined}))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                {/* Image Attachments }
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meal Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setCurrentMeal(prev => ({...prev, attachments: files}));
                    }}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {currentMeal.attachments && currentMeal.attachments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {currentMeal.attachments.length} image(s) selected
                    </div>
                  )}
                </div>

                {/* Allergens }
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Allergens
                  </label>
                  {currentMeal.allergens.map((allergen, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={allergen}
                        onChange={(e) => updateAllergen(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., nuts, dairy"
                      />
                      <button
                        type="button"
                        onClick={() => removeAllergen(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAllergen}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                  >
                    + Add Allergen
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={addMealToPlan}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all duration-300 hover:shadow-lg font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Add Meal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMealForm(false)}
                    className="px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl transition-all duration-300 hover:shadow-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit }
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={createMealPlanMutation.isPending || mealPlan.meals.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {createMealPlanMutation.isPending 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Meal Plan" : "Submit Meal Plan for Approval")
                }
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
              {isEditing 
                ? "Your changes will be saved and the meal plan will be resubmitted for approval."
                : "Once submitted, the meal plan will be sent to Support Director and Doctor for approval. If not approved/rejected within 5 hours, it will be automatically approved."
              }
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MealPlanCreation;

*/