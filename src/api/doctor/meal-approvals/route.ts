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

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: {
          select: {
            id: true,
            shortName: true,
            legalName: true,
          },
        },
      },
    });

    if (!user || user.position !== "DOCTOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get meal plans that need doctor approval
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        status: "PENDING_APPROVAL",
        // Only show meal plans that haven't been approved/rejected by this doctor yet
        NOT: {
          approvals: {
            some: {
              approverType: "DOCTOR",
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

    // Calculate stats
    const allApprovals = await prisma.mealApproval.findMany({
      where: {
        approverId: userId,
        approverType: "DOCTOR",
      },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stats = {
      pendingApprovals: mealPlans.length,
      totalApproved: allApprovals.filter(a => a.status === "APPROVED").length,
      totalRejected: allApprovals.filter(a => a.status === "REJECTED").length,
      thisWeekApprovals: allApprovals.filter(a => new Date(a.createdAt) > weekAgo).length,
      avgApprovalTime: 2.5, // Mock data - could calculate actual average
    };

    // Get recent approvals for dashboard
    const recentApprovals = await prisma.mealApproval.findMany({
      where: {
        approverId: userId,
        approverType: "DOCTOR",
      },
      include: {
        mealPlan: {
          select: {
            title: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      mealPlans,
      stats,
      userBranch: {
        id: user.branchId,
        name: user.branch?.shortName || user.branch?.legalName || `Branch ${user.branchId}` || "Unknown Branch",
      },
      recentApprovals,
    });
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

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.position !== "DOCTOR") {
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

    // Check if doctor has already approved/rejected this meal plan
    const existingApproval = mealPlan.approvals.find(
      (approval) => approval.approverType === "DOCTOR" && approval.approverId === userId
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
        approverType: "DOCTOR",
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

    let newMealPlanStatus: string = mealPlan.status;

    // If either doctor or support director rejects, the meal plan is rejected
    if (status === "REJECTED" || supportDirectorApproval?.status === "REJECTED") {
      newMealPlanStatus = "REJECTED";
    }
    // If both have approved, the meal plan is approved
    else if (status === "APPROVED" && supportDirectorApproval?.status === "APPROVED") {
      newMealPlanStatus = "APPROVED";
    }

    // Update meal plan status if it changed
    if (newMealPlanStatus !== mealPlan.status) {
      await prisma.mealPlan.update({
        where: { id: mealPlanId },
        data: { status: newMealPlanStatus as any },
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