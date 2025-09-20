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
    
    const response = NextResponse.json({ academicYears: activeAcademicYears });
    // Ensure no caching for fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Failed to fetch active academic years:", error);
    // Return empty array instead of error to prevent build failures
    return NextResponse.json({ academicYears: [] });
  }
}
