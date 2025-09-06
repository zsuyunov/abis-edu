import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if user is support HR from headers
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    const branchId = request.headers.get("x-branch-id");

    if (userRole !== "support_hr") {
      return NextResponse.json(
        { error: "Unauthorized. Support HR access required." },
        { status: 403 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { error: "Support HR must be assigned to a branch" },
        { status: 400 }
      );
    }

    // Verify user exists and has Support HR position
    const hrUser = await prisma.user.findUnique({
      where: { id: userId! },
      include: { branch: true }
    });

    if (!hrUser || hrUser.position !== "SUPPORT_HR" || hrUser.branchId !== parseInt(branchId)) {
      return NextResponse.json(
        { error: "Invalid Support HR credentials" },
        { status: 403 }
      );
    }

    // Get counts for the specific branch only
    const [teacherCount, studentCount, parentCount, staffCount] = await Promise.all([
      prisma.teacher.count({
        where: { 
          status: "ACTIVE",
          branchId: parseInt(branchId)
        }
      }),
      prisma.student.count({
        where: { 
          status: "ACTIVE",
          branchId: parseInt(branchId)
        }
      }),
      // Parents don't have direct branch association, count via students
      prisma.parent.count({
        where: { 
          status: "ACTIVE",
          students: {
            some: {
              branchId: parseInt(branchId),
              status: "ACTIVE"
            }
          }
        }
      }),
      prisma.user.count({
        where: { 
          status: "ACTIVE",
          branchId: parseInt(branchId),
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
      branchName: hrUser.branch?.shortName,
      scope: "branch_limited"
    });

  } catch (error) {
    console.error("Support HR dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
