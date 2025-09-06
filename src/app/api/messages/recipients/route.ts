import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    let recipients: any[] = [];

    if (role === "TEACHER") {
      // Get teachers from Teacher model
      const whereClause: any = {
        status: "ACTIVE",
      };

      if (branchId && branchId !== "all") {
        whereClause.branchId = parseInt(branchId);
      }

      recipients = await prisma.teacher.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          teacherId: true,
          branchId: true,
          branch: {
            select: {
              shortName: true,
            },
          },
        },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
      });

      // Transform teacher data to match user format
      recipients = recipients.map((teacher: any) => ({
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        userId: teacher.teacherId,
        position: "TEACHER",
        branchId: teacher.branchId,
        branch: teacher.branch,
      }));
    } else {
      // Get users from User model for other roles
      const whereClause: any = {
        status: "ACTIVE",
        position: role,
      };

      if (branchId && branchId !== "all") {
        whereClause.branchId = parseInt(branchId);
      }

      recipients = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userId: true,
          position: true,
          branchId: true,
          branch: {
            select: {
              shortName: true,
            },
          },
        },
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
      });
    }

    return NextResponse.json(recipients);
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipients" },
      { status: 500 }
    );
  }
}
