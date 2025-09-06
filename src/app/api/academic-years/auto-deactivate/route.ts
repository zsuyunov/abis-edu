import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { shouldAutoDeactivate } from "@/lib/academicYearUtils";

export async function POST(request: NextRequest) {
  try {
    // Get all active academic years
    const activeAcademicYears = await prisma.academicYear.findMany({
      where: { status: "ACTIVE" }
    });

    const deactivatedYears: any[] = [];

    // Check each active academic year
    for (const year of activeAcademicYears) {
      if (shouldAutoDeactivate(year.startDate, year.endDate)) {
        // Deactivate the academic year
        await prisma.academicYear.update({
          where: { id: year.id },
          data: { status: "INACTIVE" }
        });
        
        deactivatedYears.push({
          id: year.id,
          name: year.name,
          endDate: year.endDate
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-deactivation completed. ${deactivatedYears.length} academic year(s) deactivated.`,
      deactivatedYears
    });
  } catch (error) {
    console.error("Failed to auto-deactivate academic years:", error);
    return NextResponse.json(
      { error: "Failed to auto-deactivate academic years" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all active academic years with their progress
    const activeAcademicYears = await prisma.academicYear.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true
      }
    });

    const yearsWithProgress = activeAcademicYears.map(year => ({
      ...year,
      shouldDeactivate: shouldAutoDeactivate(year.startDate, year.endDate)
    }));

    return NextResponse.json({
      success: true,
      activeYears: yearsWithProgress
    });
  } catch (error) {
    console.error("Failed to get academic year progress:", error);
    return NextResponse.json(
      { error: "Failed to get academic year progress" },
      { status: 500 }
    );
  }
}
