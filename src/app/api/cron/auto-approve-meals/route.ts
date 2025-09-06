import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // This should be called by a cron job every hour
    // For now, we'll create a simple endpoint that can be triggered manually or by a scheduler

    // Find meal plans that are pending approval for more than 5 hours
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

    const pendingMealPlans = await prisma.mealPlan.findMany({
      where: {
        status: "PENDING_APPROVAL",
        createdAt: {
          lte: fiveHoursAgo,
        },
      },
    });

    const autoApprovedIds: number[] = [];

    for (const mealPlan of pendingMealPlans) {
      // Auto-approve the meal plan
      await prisma.mealPlan.update({
        where: { id: mealPlan.id },
        data: {
          status: "AUTO_APPROVED",
          autoApprovedAt: new Date(),
        },
      });

      autoApprovedIds.push(mealPlan.id);
    }

    return NextResponse.json({
      message: `Auto-approved ${autoApprovedIds.length} meal plans`,
      approvedIds: autoApprovedIds,
    });
  } catch (error) {
    console.error("Error in auto-approval:", error);
    return NextResponse.json(
      { error: "Failed to auto-approve meal plans" },
      { status: 500 }
    );
  }
}
