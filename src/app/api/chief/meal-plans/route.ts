import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "chief" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, weekStartDate, weekEndDate, meals } = body;

    // Validate required fields
    if (!title || !weekStartDate || !weekEndDate || !meals || meals.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create meal plan with meals
    const mealPlan = await prisma.mealPlan.create({
      data: {
        title,
        weekStartDate: new Date(weekStartDate),
        weekEndDate: new Date(weekEndDate),
        branchId: parseInt(branchId),
        createdById: userId,
        status: "PENDING_APPROVAL",
        meals: {
          create: meals.map((meal: any) => ({
            day: meal.day,
            mealType: meal.mealType,
            recipeTitle: meal.recipeTitle,
            description: meal.description || null,
            ingredients: meal.ingredients || [],
            allergens: meal.allergens || [],
            calories: meal.calories || null,
            preparationTime: meal.preparationTime || null,
            servingSize: meal.servingSize || null,
          })),
        },
      },
      include: {
        meals: true,
      },
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Failed to create meal plan" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "chief" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        createdById: userId,
        branchId: parseInt(branchId),
      },
      include: {
        meals: true,
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal plans" },
      { status: 500 }
    );
  }
}
