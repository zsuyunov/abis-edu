import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const branchIds = searchParams.get("branchIds");
    const academicYearId = searchParams.get("academicYearId");

    const where: any = { status: "ACTIVE" };

    if (branchId) {
      where.branchId = parseInt(branchId);
    } else if (branchIds) {
      const branchIdsArray = branchIds.split(',').map(id => parseInt(id.trim()));
      where.branchId = { in: branchIdsArray };
    }

    if (academicYearId) where.academicYearId = parseInt(academicYearId);

    const classes = await prisma.class.findMany({
      where,
      select: { 
        id: true, 
        name: true,
        branchId: true,
        academicYearId: true,
        branch: {
          select: {
            shortName: true
          }
        }
      },
      orderBy: { 
        name: "asc" 
      }
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
