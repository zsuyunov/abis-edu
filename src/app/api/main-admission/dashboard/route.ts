import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const currentUserId = headersList.get("x-user-id");

    // Check if user is main admission
    if (role !== "main_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

    // Get current date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get comprehensive dashboard statistics for all branches
    const [
      totalStudents,
      totalParents,
      newAdmissionsThisMonth,
      pendingApplications,
      branches,
      branchStats,
      recentAdmissions
    ] = await Promise.all([
      // Total active students across all branches
      prisma.student.count({ 
        where: { status: "ACTIVE" } 
      }),
      
      // Total active parents across all branches
      prisma.parent.count({ 
        where: { status: "ACTIVE" } 
      }),
      
      // New admissions this month
      prisma.student.count({
        where: {
          status: "ACTIVE",
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        }
      }),
      
      // Count students with INACTIVE status as pending applications
      prisma.student.count({
        where: { status: "INACTIVE" }
      }),
      
      // Get all active branches
      prisma.branch.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          shortName: true,
          legalName: true
        }
      }),
      
      // Get student count per branch with new admissions
      prisma.branch.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          shortName: true,
          _count: {
            select: {
              students: {
                where: { status: "ACTIVE" }
              }
            }
          }
        }
      }),
      
      // Get recent admissions across all branches
      prisma.student.findMany({
        where: { status: "ACTIVE" },
        include: {
          branch: {
            select: {
              shortName: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    // Process branch statistics with new admissions count
    const branchStatsWithAdmissions = await Promise.all(
      branchStats.map(async (branch) => {
        const newAdmissions = await prisma.student.count({
          where: {
            branchId: branch.id,
            status: "ACTIVE",
            createdAt: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            }
          }
        });

        return {
          branchId: branch.id,
          branchName: branch.shortName,
          studentCount: branch._count.students,
          newAdmissions
        };
      })
    );

    // Format recent admissions
    const formattedRecentAdmissions = recentAdmissions.map(admission => ({
      id: admission.id,
      name: `${admission.firstName} ${admission.lastName}`,
      branchName: admission.branch.shortName,
      admissionDate: admission.createdAt.toISOString(),
      status: admission.status
    }));

    const dashboardData = {
      totalStudents,
      totalParents,
      newAdmissionsThisMonth,
      pendingApplications,
      branchStats: branchStatsWithAdmissions,
      recentAdmissions: formattedRecentAdmissions
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error("Main Admission dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
