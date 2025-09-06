import { NextRequest, NextResponse } from "next/server";
import { getGradebookStatistics } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const academicYearId = searchParams.get("academicYearId");
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const gradeType = searchParams.get("gradeType");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  
  if (!branchId || !academicYearId || !classId || !subjectId) {
    return NextResponse.json(
      { error: "Branch, Academic Year, Class, and Subject are required" },
      { status: 400 }
    );
  }

  try {
    const statistics = await getGradebookStatistics(
      parseInt(branchId),
      parseInt(academicYearId),
      parseInt(classId),
      parseInt(subjectId),
      gradeType || undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching gradebook statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch gradebook statistics" },
      { status: 500 }
    );
  }
}
