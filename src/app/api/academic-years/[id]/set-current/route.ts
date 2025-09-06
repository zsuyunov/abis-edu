import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const academicYearId = parseInt(params.id);

    // Check if academic year exists and is active
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId }
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 }
      );
    }

    if (academicYear.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active academic years can be set as current" },
        { status: 400 }
      );
    }

    // Remove current flag from all academic years
    await prisma.academicYear.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false }
    });

    // Set this academic year as current
    const updatedAcademicYear = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: { isCurrent: true },
      include: {
        semesters: {
          orderBy: { startDate: "asc" }
        }
      }
    });

    return NextResponse.json({ academicYear: updatedAcademicYear });
  } catch (error) {
    console.error("Failed to set current academic year:", error);
    return NextResponse.json(
      { error: "Failed to set current academic year" },
      { status: 500 }
    );
  }
}
