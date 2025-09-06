import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const currentUserId = headersList.get("x-user-id");
    const userBranchId = headersList.get("x-branch-id");

    // Check if user is support admission
    if (role !== "support_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Support Admission access required" },
        { status: 403 }
      );
    }

    // Check if user has assigned branch
    if (!userBranchId) {
      return NextResponse.json(
        { error: "No branch assigned to user" },
        { status: 400 }
      );
    }

    const branchId = parseInt(userBranchId);

    // Get current date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    // Get comprehensive dashboard statistics for assigned branch only
    const [
      totalStudents,
      totalParents,
      newAdmissionsThisMonth,
      pendingApplications,
      branchInfo,
      totalAdmissionsThisYear,
      recentAdmissions
    ] = await Promise.all([
      // Total active students in assigned branch
      prisma.student.count({ 
        where: { 
          status: "ACTIVE",
          branchId: branchId
        } 
      }),
      
      // Total active parents with students in assigned branch
      prisma.parent.count({ 
        where: { 
          status: "ACTIVE",
          students: {
            some: {
              branchId: branchId,
              status: "ACTIVE"
            }
          }
        } 
      }),
      
      // New admissions this month in assigned branch
      prisma.student.count({
        where: {
          status: "ACTIVE",
          branchId: branchId,
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        }
      }),
      
      // Count students with INACTIVE status in assigned branch as pending
      prisma.student.count({
        where: { 
          status: "INACTIVE",
          branchId: branchId
        }
      }),
      
      // Get branch information
      prisma.branch.findUnique({
        where: { id: branchId },
        select: {
          id: true,
          shortName: true,
          legalName: true
        }
      }),
      
      // Total admissions this year for progress tracking
      prisma.student.count({
        where: {
          branchId: branchId,
          status: "ACTIVE",
          createdAt: {
            gte: firstDayOfYear
          }
        }
      }),
      
      // Get recent admissions in assigned branch
      prisma.student.findMany({
        where: { 
          status: "ACTIVE",
          branchId: branchId
        },
        orderBy: { createdAt: "desc" },
        take: 8
      })
    ]);

    // Calculate admission progress (assuming target of 100 per year for example)
    const admissionTarget = 100; // This could be configurable per branch
    const admissionProgress = {
      target: admissionTarget,
      achieved: totalAdmissionsThisYear,
      percentage: Math.min((totalAdmissionsThisYear / admissionTarget) * 100, 100)
    };

    // Format recent admissions
    const formattedRecentAdmissions = recentAdmissions.map(admission => ({
      id: admission.id,
      name: `${admission.firstName} ${admission.lastName}`,
      admissionDate: admission.createdAt.toISOString(),
      status: admission.status
    }));

    const dashboardData = {
      totalStudents,
      totalParents,
      newAdmissionsThisMonth,
      pendingApplications,
      branchInfo: {
        branchId: branchInfo?.id || branchId,
        branchName: branchInfo?.shortName || 'Unknown Branch'
      },
      admissionProgress,
      recentAdmissions: formattedRecentAdmissions
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error("Support Admission dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
