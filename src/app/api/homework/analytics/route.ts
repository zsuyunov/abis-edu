import { NextRequest, NextResponse } from "next/server";
import { getHomeworkAnalytics } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const academicYearId = searchParams.get("academicYearId");
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const dateRange = searchParams.get("dateRange");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Validate required parameters
  if (!branchId || !academicYearId) {
    return NextResponse.json(
      { error: "Branch ID and Academic Year ID are required" },
      { status: 400 }
    );
  }

  try {
    // Calculate date range based on dateRange parameter
    let calculatedStartDate: Date | undefined;
    let calculatedEndDate: Date | undefined;

    if (dateRange && dateRange !== "ALL") {
      const now = new Date();
      switch (dateRange) {
        case "TODAY":
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case "WEEK":
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          calculatedStartDate = startOfWeek;
          calculatedEndDate = new Date(startOfWeek);
          calculatedEndDate.setDate(startOfWeek.getDate() + 7);
          break;
        case "MONTH":
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "TERM":
          // Assuming term is roughly 3 months
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "YEAR":
          calculatedStartDate = new Date(now.getFullYear(), 0, 1);
          calculatedEndDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
      }
    } else if (startDate && endDate) {
      calculatedStartDate = new Date(startDate);
      calculatedEndDate = new Date(endDate);
    }

    const analytics = await getHomeworkAnalytics(
      parseInt(branchId),
      parseInt(academicYearId),
      classId ? parseInt(classId) : undefined,
      subjectId ? parseInt(subjectId) : undefined,
      teacherId || undefined,
      calculatedStartDate,
      calculatedEndDate
    );
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching homework analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework analytics" },
      { status: 500 }
    );
  }
}
