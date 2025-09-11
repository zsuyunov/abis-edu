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

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const status = searchParams.get("status");
    const view = searchParams.get("view") || "week";

    // Verify user is a chief
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.position !== "CHIEF") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!user.branchId) {
      return NextResponse.json(
        { error: "User branch not found" },
        { status: 400 }
      );
    }

    const currentDate = dateParam ? new Date(dateParam) : new Date();
    let startDate: Date;
    let endDate: Date;

    if (view === "week") {
      // Get start of week (Monday)
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);
      startDate.setHours(0, 0, 0, 0);
      
      // Get end of week (Sunday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Month view
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const whereClause: any = {
      branchId: user.branchId,
      createdById: userId,
      OR: [
        {
          weekStartDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          weekEndDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [
            { weekStartDate: { lte: startDate } },
            { weekEndDate: { gte: endDate } },
          ],
        },
      ],
    };

    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where: whereClause,
      include: {
        meals: {
          orderBy: [
            { day: "asc" },
            { mealType: "asc" },
          ],
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

    return NextResponse.json({
      mealPlans,
      userBranch: {
        id: user.branchId,
        name: `Branch ${user.branchId}` // Placeholder name since Branch model doesn't have name field
      }
    });
  } catch (error) {
    console.error("Error fetching meal calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


*/