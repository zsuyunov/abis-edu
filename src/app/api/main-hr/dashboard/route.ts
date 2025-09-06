import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if user is main HR from headers
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    if (userRole !== "main_hr") {
      return NextResponse.json(
        { error: "Unauthorized. Main HR access required." },
        { status: 403 }
      );
    }

    // Verify user exists and has Main HR position
    const hrUser = await prisma.user.findUnique({
      where: { id: userId! },
      include: { branch: true }
    });

    if (!hrUser || hrUser.position !== "MAIN_HR") {
      return NextResponse.json(
        { error: "Invalid Main HR credentials" },
        { status: 403 }
      );
    }

    // Get counts across all branches
    const [teacherCount, studentCount, parentCount, staffCount] = await Promise.all([
      prisma.teacher.count({
        where: { status: "ACTIVE" }
      }),
      prisma.student.count({
        where: { status: "ACTIVE" }
      }),
      prisma.parent.count({
        where: { status: "ACTIVE" }
      }),
      prisma.user.count({
        where: { 
          status: "ACTIVE",
          position: {
            in: ["MAIN_DIRECTOR", "SUPPORT_DIRECTOR", "MAIN_HR", "SUPPORT_HR", "MAIN_ADMISSION", "SUPPORT_ADMISSION", "DOCTOR", "CHIEF"]
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      teacherCount,
      studentCount,
      parentCount,
      staffCount,
      scope: "all_branches"
    });

  } catch (error) {
    console.error("Main HR dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
