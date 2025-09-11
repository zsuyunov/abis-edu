
/*import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or scheduled task
    // to handle auto-approval of meal plans after 5 hours

    const now = new Date();
    
    // Find meal plans that are pending approval and past their auto-approval time
    const mealPlansToAutoApprove = await prisma.mealPlan.findMany({
      where: {
        status: "PENDING_APPROVAL",
        autoApprovedAt: {
          lte: now,
        },
      },
      include: {
        approvals: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const results = [];

    for (const mealPlan of mealPlansToAutoApprove) {
      try {
        // Check if there are any rejections
        const hasRejection = mealPlan.approvals.some(
          (approval) => approval.status === "REJECTED"
        );

        if (hasRejection) {
          // Don't auto-approve if there's a rejection
          continue;
        }

        // Auto-approve the meal plan
        await prisma.$transaction(async (tx) => {
          // Update meal plan status
          await tx.mealPlan.update({
            where: { id: mealPlan.id },
            data: {
              status: "APPROVED",
            },
          });

          // Create auto-approval records for missing approvals
          const doctorApproval = mealPlan.approvals.find(
            (a) => a.approverType === "DOCTOR"
          );
          const supportDirectorApproval = mealPlan.approvals.find(
            (a) => a.approverType === "SUPPORT_DIRECTOR"
          );

          const autoApprovals = [];

          if (!doctorApproval) {
            // Find a doctor user for this meal plan's branch
            const doctorUser = await tx.user.findFirst({
              where: {
                position: "DOCTOR",
                branchId: mealPlan.branchId,
                status: "ACTIVE",
              },
            });

            if (doctorUser) {
              autoApprovals.push({
                mealPlanId: mealPlan.id,
                approverId: doctorUser.id,
                approverType: "DOCTOR" as const,
                status: "APPROVED" as const,
                comment: "Auto-approved after 5 hours without response",
              });
            }
          }

          if (!supportDirectorApproval) {
            // Find a support director user for this meal plan's branch
            const supportDirectorUser = await tx.user.findFirst({
              where: {
                position: "SUPPORT_DIRECTOR",
                branchId: mealPlan.branchId,
                status: "ACTIVE",
              },
            });

            if (supportDirectorUser) {
              autoApprovals.push({
                mealPlanId: mealPlan.id,
                approverId: supportDirectorUser.id,
                approverType: "SUPPORT_DIRECTOR" as const,
                status: "APPROVED" as const,
                comment: "Auto-approved after 5 hours without response",
              });
            }
          }

          if (autoApprovals.length > 0) {
            await tx.mealApproval.createMany({
              data: autoApprovals,
            });
          }
        });

        results.push({
          mealPlanId: mealPlan.id,
          title: mealPlan.title,
          status: "auto-approved",
        });

        // Here you would typically send notifications to relevant users
        // about the auto-approval
        console.log(`Auto-approved meal plan: ${mealPlan.title} (ID: ${mealPlan.id})`);
        
      } catch (error) {
        console.error(`Error auto-approving meal plan ${mealPlan.id}:`, error);
        results.push({
          mealPlanId: mealPlan.id,
          title: mealPlan.title,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      message: "Auto-approval process completed",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in auto-approval process:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check which meal plans are eligible for auto-approval
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    const eligibleMealPlans = await prisma.mealPlan.findMany({
      where: {
        status: "PENDING_APPROVAL",
        autoApprovedAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        autoApprovedAt: true,
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

    return NextResponse.json({
      count: eligibleMealPlans.length,
      mealPlans: eligibleMealPlans,
    });
  } catch (error) {
    console.error("Error checking eligible meal plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


*/