import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Only return active/current academic years, latest first
    const academicYears = await prisma.academicYear.findMany({
      where: { status: "ACTIVE" },
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      },
      orderBy: { 
        startDate: "desc" 
      }
    });
    
    const response = NextResponse.json(academicYears);
    // Ensure no caching for fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Failed to fetch academic years:", error);
    return NextResponse.json(
      { error: "Failed to fetch academic years" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, isCurrent, semesters } = body;

    // Enforce single active/current academic year
    await prisma.$transaction(async (tx) => {
      // Mark all previous years as INACTIVE and not current
      await tx.academicYear.updateMany({
        where: {},
        data: { isCurrent: false, status: "INACTIVE" }
      });

      // Create new ACTIVE + CURRENT academic year
      await tx.academicYear.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent: true,
          status: "ACTIVE",
          semesters: {
            create: semesters.map((semester: any) => ({
              name: semester.name,
              startDate: new Date(semester.startDate),
              endDate: new Date(semester.endDate)
            }))
          }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create academic year:", error);
    return NextResponse.json(
      { error: "Failed to create academic year" },
      { status: 500 }
    );
  }
}
