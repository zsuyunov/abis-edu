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

    // Get meal plans pending approval in this branch
    const pendingMealPlans = await prisma.mealPlan.count({
      where: {
        branchId: parseInt(branchId),
        status: "PENDING_APPROVAL",
        // Check if doctor has not approved yet
        NOT: {
          approvals: {
            some: {
              approverId: userId,
              approverType: "DOCTOR",
            },
          },
        },
      },
    });

    // Get doctor's approval statistics
    const doctorApprovals = await prisma.mealApproval.groupBy({
      by: ['status'],
      where: {
        approverId: userId,
        approverType: "DOCTOR",
      },
      _count: {
        id: true,
      },
    });

    const result = {
      pendingApprovals: pendingMealPlans,
      totalApproved: 0,
      totalRejected: 0,
    };

    doctorApprovals.forEach((approval) => {
      if (approval.status === 'APPROVED') {
        result.totalApproved = approval._count.id;
      } else if (approval.status === 'REJECTED') {
        result.totalRejected = approval._count.id;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
