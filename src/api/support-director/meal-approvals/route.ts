/*
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a support director
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.position !== "SUPPORT_DIRECTOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get meal plans that need support director approval
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        status: "PENDING_APPROVAL",
        // Only show meal plans that haven't been approved/rejected by this support director yet
        NOT: {
          approvals: {
            some: {
              approverType: "SUPPORT_DIRECTOR",
              approverId: userId,
            },
          },
        },
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
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: {
            shortName: true,
            legalName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal approvals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a support director
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.position !== "SUPPORT_DIRECTOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { mealPlanId, status, comment } = body;

    if (!mealPlanId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    if (status === "REJECTED" && !comment?.trim()) {
      return NextResponse.json(
        { error: "Comment is required for rejection" },
        { status: 400 }
      );
    }

    // Check if meal plan exists and is pending approval
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      include: {
        approvals: true,
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    if (mealPlan.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Meal plan is not pending approval" },
        { status: 400 }
      );
    }

    // Check if support director has already approved/rejected this meal plan
    const existingApproval = mealPlan.approvals.find(
      (approval) => approval.approverType === "SUPPORT_DIRECTOR" && approval.approverId === userId
    );

    if (existingApproval) {
      return NextResponse.json(
        { error: "You have already processed this meal plan" },
        { status: 400 }
      );
    }

    // Create approval record
    await prisma.mealApproval.create({
      data: {
        mealPlanId,
        approverId: userId,
        approverType: "SUPPORT_DIRECTOR",
        status,
        comment: comment?.trim() || null,
      },
    });

    // Check if we need to update meal plan status
    const allApprovals = await prisma.mealApproval.findMany({
      where: { mealPlanId },
    });

    const doctorApproval = allApprovals.find(a => a.approverType === "DOCTOR");
    const supportDirectorApproval = allApprovals.find(a => a.approverType === "SUPPORT_DIRECTOR");

    let newMealPlanStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "AUTO_APPROVED" = mealPlan.status;

    // If either doctor or support director rejects, the meal plan is rejected
    if (status === "REJECTED" || doctorApproval?.status === "REJECTED") {
      newMealPlanStatus = "REJECTED";
    }
    // If both have approved, the meal plan is approved
    else if (status === "APPROVED" && doctorApproval?.status === "APPROVED") {
      newMealPlanStatus = "APPROVED";
    }

    // Update meal plan status if it changed
    if (newMealPlanStatus !== mealPlan.status) {
      await prisma.mealPlan.update({
        where: { id: mealPlanId },
        data: { status: newMealPlanStatus },
      });
    }

    return NextResponse.json({
      message: "Approval processed successfully",
      status: newMealPlanStatus,
    });
  } catch (error) {
    console.error("Error processing meal approval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



*/