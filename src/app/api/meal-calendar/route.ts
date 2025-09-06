import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    const branchId = request.headers.get("x-branch-id");

    if (!userId || !userRole || !branchId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow chief, doctor, and support_director to view meal calendar
    const allowedRoles = ["chief", "doctor", "support_director"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let whereClause: any = {
      branchId: parseInt(branchId),
      status: {
        in: ["APPROVED", "AUTO_APPROVED"],
      },
    };

    if (startDate && endDate) {
      whereClause.weekStartDate = {
        gte: new Date(startDate),
      };
      whereClause.weekEndDate = {
        lte: new Date(endDate),
      };
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: whereClause,
      include: {
        meals: {
          orderBy: [
            {
              day: "asc",
            },
            {
              mealType: "asc",
            },
          ],
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        weekStartDate: "asc",
      },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal calendar" },
      { status: 500 }
    );
  }
}
