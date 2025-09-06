import { NextRequest, NextResponse } from "next/server";
import { getComplaintAnalytics } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const analytics = await getComplaintAnalytics(
      branchId ? parseInt(branchId) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching complaint analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint analytics" },
      { status: 500 }
    );
  }
}
