import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || userRole !== "chief" || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await prisma.mealPlan.groupBy({
      by: ['status'],
      where: {
        createdById: userId,
        branchId: parseInt(branchId),
      },
      _count: {
        id: true,
      },
    });

    const result = {
      totalMealPlans: 0,
      pendingApproval: 0,
      approved: 0,
      rejected: 0,
      autoApproved: 0,
    };

    stats.forEach((stat) => {
      result.totalMealPlans += stat._count.id;
      
      switch (stat.status) {
        case 'PENDING_APPROVAL':
          result.pendingApproval = stat._count.id;
          break;
        case 'APPROVED':
          result.approved = stat._count.id;
          break;
        case 'REJECTED':
          result.rejected = stat._count.id;
          break;
        case 'AUTO_APPROVED':
          result.autoApproved = stat._count.id;
          break;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching chief stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
