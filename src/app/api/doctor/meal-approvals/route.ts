import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "doctor" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get meal plans in this branch that need doctor approval
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        branchId: parseInt(branchId),
        status: "PENDING_APPROVAL",
      },
      include: {
        meals: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal approvals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "doctor" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealPlanId, status, comment } = body;

    if (!mealPlanId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (status === "REJECTED" && !comment?.trim()) {
      return NextResponse.json(
        { error: "Comment is required for rejection" },
        { status: 400 }
      );
    }

    // Check if meal plan exists and belongs to the same branch
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: mealPlanId,
        branchId: parseInt(branchId),
        status: "PENDING_APPROVAL",
      },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: "Meal plan not found or already processed" },
        { status: 404 }
      );
    }

    // Check if doctor has already approved/rejected this meal plan
    const existingApproval = await prisma.mealApproval.findFirst({
      where: {
        mealPlanId,
        approverId: userId,
        approverType: "DOCTOR",
      },
    });

    if (existingApproval) {
      return NextResponse.json(
        { error: "You have already processed this meal plan" },
        { status: 400 }
      );
    }

    // Create the approval record
    const approval = await prisma.mealApproval.create({
      data: {
        mealPlanId,
        approverId: userId,
        approverType: "DOCTOR",
        status,
        comment: comment || null,
      },
    });

    // If rejected, update meal plan status
    if (status === "REJECTED") {
      await prisma.mealPlan.update({
        where: { id: mealPlanId },
        data: { status: "REJECTED" },
      });
    } else if (status === "APPROVED") {
      // Check if support director has also approved
      const supportDirectorApproval = await prisma.mealApproval.findFirst({
        where: {
          mealPlanId,
          approverType: "SUPPORT_DIRECTOR",
          status: "APPROVED",
        },
      });

      // If both doctor and support director have approved, mark as approved
      if (supportDirectorApproval) {
        await prisma.mealPlan.update({
          where: { id: mealPlanId },
          data: { status: "APPROVED" },
        });
      }
    }

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Error processing meal approval:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
