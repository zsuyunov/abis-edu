import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
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

    // Get branch information
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        shortName: true,
        legalName: true,
        phone: true,
        region: true,
        address: true,
        status: true,
      }
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      branch
    });

  } catch (error) {
    console.error("Support Admission branch info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
