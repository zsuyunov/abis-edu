import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userBranchId = headersList.get("x-branch-id");

    if (role !== "support_admission") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!userBranchId) {
      return NextResponse.json({ error: "No branch assigned" }, { status: 400 });
    }
    const branchId = parseInt(userBranchId);

    // Unassigned students: no StudentParent rows
    const students = await prisma.student.findMany({
      where: {
        branchId,
        studentParents: { none: {} },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        class: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


