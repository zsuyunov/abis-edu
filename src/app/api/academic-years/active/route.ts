import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const activeAcademicYears = await prisma.academicYear.findMany({
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
    });
    
    return NextResponse.json({ academicYears: activeAcademicYears });
  } catch (error) {
    console.error("Failed to fetch active academic years:", error);
    return NextResponse.json(
      { error: "Failed to fetch active academic years" },
      { status: 500 }
    );
  }
}
