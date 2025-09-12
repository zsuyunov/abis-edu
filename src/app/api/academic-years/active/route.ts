import { NextResponse } from "next/server";
import prisma, { withPrismaRetry } from "@/lib/prisma";

export async function GET() {
  try {
    const activeAcademicYears = await withPrismaRetry(() =>
      prisma.academicYear.findMany({
        where: { status: "ACTIVE" },
        select: { 
          id: true, 
          name: true,
          startDate: true,
          endDate: true,
          isCurrent: true
        },
        orderBy: { 
          startDate: "desc" 
        }
      })
    );
    
    return NextResponse.json({ academicYears: activeAcademicYears });
  } catch (error) {
    console.error("Failed to fetch active academic years:", error);
    // Return empty array instead of error to prevent build failures
    return NextResponse.json({ academicYears: [] });
  }
}
