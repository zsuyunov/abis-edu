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

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notifications = [];

    // For Chiefs: Get notifications about their meal plan approvals/rejections
    if (user.position === "CHIEF") {
      const mealPlanUpdates = await prisma.mealPlan.findMany({
        where: {
          createdById: userId,
          status: { in: ["APPROVED", "REJECTED", "AUTO_APPROVED"] },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
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
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      for (const mealPlan of mealPlanUpdates) {
        const latestApproval = mealPlan.approvals[0];
        
        if (mealPlan.status === "AUTO_APPROVED") {
          notifications.push({
            id: `meal-plan-${mealPlan.id}-auto-approved`,
            type: "meal_plan_auto_approved",
            title: "Meal Plan Auto-Approved",
            message: `Your meal plan "${mealPlan.title}" was automatically approved after 5 hours.`,
            timestamp: mealPlan.updatedAt,
            data: {
              mealPlanId: mealPlan.id,
              mealPlanTitle: mealPlan.title,
            },
          });
        } else if (latestApproval) {
          notifications.push({
            id: `meal-plan-${mealPlan.id}-${latestApproval.id}`,
            type: mealPlan.status === "APPROVED" ? "meal_plan_approved" : "meal_plan_rejected",
            title: mealPlan.status === "APPROVED" ? "Meal Plan Approved" : "Meal Plan Rejected",
            message: mealPlan.status === "APPROVED" 
              ? `Your meal plan "${mealPlan.title}" was approved by ${latestApproval.approver?.firstName} ${latestApproval.approver?.lastName} (${latestApproval.approverType}).`
              : `Your meal plan "${mealPlan.title}" was rejected by ${latestApproval.approver?.firstName} ${latestApproval.approver?.lastName} (${latestApproval.approverType}). ${latestApproval.comment ? `Reason: ${latestApproval.comment}` : ''}`,
            timestamp: latestApproval.createdAt,
            data: {
              mealPlanId: mealPlan.id,
              mealPlanTitle: mealPlan.title,
              approverName: `${latestApproval.approver?.firstName} ${latestApproval.approver?.lastName}`,
              approverType: latestApproval.approverType,
              comment: latestApproval.comment,
            },
          });
        }
      }
    }

    // For Doctors and Support Directors: Get notifications about new meal plans to review
    if (user.position === "DOCTOR" || user.position === "SUPPORT_DIRECTOR") {
      const pendingMealPlans = await prisma.mealPlan.findMany({
        where: {
          status: "PENDING_APPROVAL",
          branchId: user.branchId || undefined,
          NOT: {
            approvals: {
              some: {
                approverType: user.position,
                approverId: userId,
              },
            },
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
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
          createdAt: "desc",
        },
      });

      for (const mealPlan of pendingMealPlans) {
        notifications.push({
          id: `meal-plan-review-${mealPlan.id}`,
          type: "meal_plan_review_needed",
          title: "New Meal Plan Review",
          message: `A new meal plan "${mealPlan.title}" from ${mealPlan.createdBy.firstName} ${mealPlan.createdBy.lastName} needs your review.`,
          timestamp: mealPlan.createdAt,
          data: {
            mealPlanId: mealPlan.id,
            mealPlanTitle: mealPlan.title,
            creatorName: `${mealPlan.createdBy.firstName} ${mealPlan.createdBy.lastName}`,
            branchName: mealPlan.branch?.shortName || mealPlan.branch?.legalName,
          },
        });
      }

      // Get notifications about meal plans approaching auto-approval
      const approachingAutoApproval = await prisma.mealPlan.findMany({
        where: {
          status: "PENDING_APPROVAL",
          branchId: user.branchId || undefined,
          autoApprovedAt: {
            lte: new Date(Date.now() + 60 * 60 * 1000), // Within 1 hour
            gte: new Date(), // Not yet passed
          },
          NOT: {
            approvals: {
              some: {
                approverType: user.position,
                approverId: userId,
              },
            },
          },
        },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          autoApprovedAt: "asc",
        },
      });

      for (const mealPlan of approachingAutoApproval) {
        const timeLeft = Math.round((mealPlan.autoApprovedAt!.getTime() - Date.now()) / (1000 * 60));
        notifications.push({
          id: `meal-plan-urgent-${mealPlan.id}`,
          type: "meal_plan_urgent_review",
          title: "Urgent: Meal Plan Review",
          message: `Meal plan "${mealPlan.title}" will be auto-approved in ${timeLeft} minutes. Please review now.`,
          timestamp: new Date(),
          data: {
            mealPlanId: mealPlan.id,
            mealPlanTitle: mealPlan.title,
            timeLeftMinutes: timeLeft,
          },
        });
      }
    }

    return NextResponse.json({
      notifications: notifications.slice(0, 20), // Limit to 20 most recent
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching meal approval notifications:", error);
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

    const body = await request.json();
    const { type, recipientIds, data } = body;

    // This endpoint can be used to send notifications
    // In a real application, you would store notifications in the database
    // and potentially send push notifications, emails, etc.

    console.log("Sending notification:", {
      type,
      recipientIds,
      data,
      sender: userId,
    });

    // Here you would implement the actual notification sending logic
    // For now, we'll just log it

    return NextResponse.json({
      message: "Notification sent successfully",
      type,
      recipientCount: recipientIds?.length || 0,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


*/