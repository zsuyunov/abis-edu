import { NextRequest, NextResponse } from "next/server";
import { archiveAttendance } from "@/lib/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { comment, currentUserId } = body;

    if (!comment || !currentUserId) {
      return NextResponse.json(
        { error: "Comment and current user ID are required" },
        { status: 400 }
      );
    }

    const result = await archiveAttendance(params.id, comment, currentUserId);
    
    if (result.success) {
      return NextResponse.json({ message: "Attendance record archived successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to archive attendance record" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error archiving attendance:", error);
    return NextResponse.json(
      { error: "Failed to archive attendance record" },
      { status: 500 }
    );
  }
}
