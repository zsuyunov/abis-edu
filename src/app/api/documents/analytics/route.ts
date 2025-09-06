import { NextRequest, NextResponse } from "next/server";
import { getDocumentAnalytics } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const analytics = await getDocumentAnalytics(
      branchId ? parseInt(branchId) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching document analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch document analytics" },
      { status: 500 }
    );
  }
}
