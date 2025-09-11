/*
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const sessionUser = session?.user as SessionUser;
    if (!session?.user || !sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/chief/meal-plans - Session user:", sessionUser.id);

    const body = await request.json();
    const { title, weekStartDate, weekEndDate, meals } = body;

    // Validate required fields
    if (!title || !weekStartDate || !weekEndDate || !meals || meals.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user's branch - try both id and userId fields
    let user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { branch: true }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { userId: sessionUser.id },
        include: { branch: true }
      });
    }

    console.log("POST - User found:", user ? "Yes" : "No");
    console.log("POST - User branch:", user?.branch);

    if (!user || !user.branchId) {
      return NextResponse.json(
        { error: "User branch not found" },
        { status: 400 }
      );
    }

    // Create meal plan with meals in a transaction
    const mealPlan = await prisma.$transaction(async (tx) => {
      // Create the meal plan
      const newMealPlan = await tx.mealPlan.create({
        data: {
          title,
          weekStartDate: new Date(weekStartDate),
          weekEndDate: new Date(weekEndDate),
          status: "PENDING_APPROVAL",
          branchId: user.branchId!,
          createdById: sessionUser.id,
        },
      });

      // Create meals for the meal plan
      const mealData = meals.map((meal: any) => ({
        mealPlanId: newMealPlan.id,
        day: meal.day,
        mealType: meal.mealType,
        recipeTitle: meal.recipeTitle,
        description: meal.description || null,
        ingredients: meal.ingredients,
        allergens: meal.allergens,
        calories: meal.calories || null,
        preparationTime: meal.preparationTime || null,
        servingSize: meal.servingSize || null,
        mealAmount: meal.mealAmount || null,
      }));

      await tx.meal.createMany({
        data: mealData,
      });

      return newMealPlan;
    });

    // Schedule auto-approval after 5 hours
    // Note: In a real application, you would use a job queue or cron job
    // For now, we'll store the auto-approval time
    await prisma.mealPlan.update({
      where: { id: mealPlan.id },
      data: {
        autoApprovedAt: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      },
    });

    return NextResponse.json({
      message: "Meal plan created successfully",
      mealPlan: {
        id: mealPlan.id,
        title: mealPlan.title,
        status: mealPlan.status,
      },
    });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const sessionUser = session?.user as SessionUser;
    if (!session?.user || !sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Get user's branch - try both id and userId fields
    let user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { branch: true }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { userId: sessionUser.id },
        include: { branch: true }
      });
    }

    console.log("GET - User found:", user ? "Yes" : "No");
    console.log("GET - User branch:", user?.branch);
    console.log("GET - Session user ID:", sessionUser.id);

    if (!user || !user.branchId) {
      return NextResponse.json(
        { error: "User branch not found" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      branchId: user.branchId,
      createdById: sessionUser.id,
    };

    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: whereClause,
      include: {
        meals: {
          orderBy: [
            { day: "asc" },
            { mealType: "asc" },
          ],
        },
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                position: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    const stats = {
      totalMealPlans: mealPlans.length,
      pendingApproval: mealPlans.filter(plan => plan.status === "PENDING_APPROVAL").length,
      approved: mealPlans.filter(plan => plan.status === "APPROVED" || plan.status === "AUTO_APPROVED").length,
      rejected: mealPlans.filter(plan => plan.status === "REJECTED").length,
      autoApproved: mealPlans.filter(plan => plan.status === "AUTO_APPROVED").length,
      thisWeekPlans: mealPlans.filter(plan => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(plan.createdAt) > weekAgo;
      }).length,
    };

    return NextResponse.json({
      mealPlans,
      stats,
      userBranch: {
        id: user.branchId,
        name: user.branch?.shortName || user.branch?.legalName || `Branch ${user.branch?.id}` || "Unknown Branch",
      },
    });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    const sessionUser = session?.user as SessionUser;
    if (!session?.user || !sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, weekStartDate, weekEndDate, meals } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Meal plan ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!title || !weekStartDate || !weekEndDate || !meals || meals.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if meal plan exists and belongs to user
    const existingMealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: parseInt(id),
        createdById: sessionUser.id,
      },
    });

    if (!existingMealPlan) {
      return NextResponse.json(
        { error: "Meal plan not found or access denied" },
        { status: 404 }
      );
    }

    // Check if meal plan can be edited (not approved yet)
    if (existingMealPlan.status === "APPROVED" || existingMealPlan.status === "AUTO_APPROVED") {
      return NextResponse.json(
        { error: "Cannot edit approved meal plans" },
        { status: 400 }
      );
    }

    // Update meal plan with meals in a transaction
    const updatedMealPlan = await prisma.$transaction(async (tx) => {
      // Update the meal plan
      const updated = await tx.mealPlan.update({
        where: { id: parseInt(id) },
        data: {
          title,
          weekStartDate: new Date(weekStartDate),
          weekEndDate: new Date(weekEndDate),
          status: "PENDING_APPROVAL", // Reset to pending if it was rejected
        },
      });

      // Delete existing meals
      await tx.meal.deleteMany({
        where: { mealPlanId: parseInt(id) },
      });

      // Create new meals
      const mealData = meals.map((meal: any) => ({
        mealPlanId: parseInt(id),
        day: meal.day,
        mealType: meal.mealType,
        recipeTitle: meal.recipeTitle,
        description: meal.description || null,
        ingredients: meal.ingredients,
        allergens: meal.allergens,
        calories: meal.calories || null,
        preparationTime: meal.preparationTime || null,
        servingSize: meal.servingSize || null,
      }));

      await tx.meal.createMany({
        data: mealData,
      });

      // Reset auto-approval time
      await tx.mealPlan.update({
        where: { id: parseInt(id) },
        data: {
          autoApprovedAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: "Meal plan updated successfully",
      mealPlan: {
        id: updatedMealPlan.id,
        title: updatedMealPlan.title,
        status: updatedMealPlan.status,
      },
    });
  } catch (error) {
    console.error("Error updating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    const sessionUser = session?.user as SessionUser;
    if (!session?.user || !sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Meal plan ID is required" },
        { status: 400 }
      );
    }

    // Check if meal plan exists and belongs to user
    const existingMealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: parseInt(id),
        createdById: sessionUser.id,
      },
    });

    if (!existingMealPlan) {
      return NextResponse.json(
        { error: "Meal plan not found or access denied" },
        { status: 404 }
      );
    }

    // Check if meal plan can be deleted (not approved yet)
    if (existingMealPlan.status === "APPROVED" || existingMealPlan.status === "AUTO_APPROVED") {
      return NextResponse.json(
        { error: "Cannot delete approved meal plans" },
        { status: 400 }
      );
    }

    // Delete meal plan and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete meals
      await tx.meal.deleteMany({
        where: { mealPlanId: parseInt(id) },
      });

      // Delete approvals
      await tx.mealApproval.deleteMany({
        where: { mealPlanId: parseInt(id) },
      });

      // Delete meal plan
      await tx.mealPlan.delete({
        where: { id: parseInt(id) },
      });
    });

    return NextResponse.json({
      message: "Meal plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


*/