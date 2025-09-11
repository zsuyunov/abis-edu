import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all academic years
    const allAcademicYears = await prisma.academicYear.findMany({
      select: {
        id: true,
        name: true,
        isCurrent: true,
        status: true,
        startDate: true,
        endDate: true
      },
      orderBy: { startDate: 'desc' }
    });

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: {
        isCurrent: true,
        status: 'ACTIVE'
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Get latest active academic year
    const latestActiveAcademicYear = await prisma.academicYear.findFirst({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json({
      allAcademicYears,
      currentAcademicYear,
      latestActiveAcademicYear,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug academic years error:', error);
    return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 });
  }
}
