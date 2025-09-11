import { NextRequest, NextResponse } from "next/server";
import { archiveTimetable } from "@/lib/actions";

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

    const result = await archiveTimetable(params.id, comment, currentUserId);
    
    if (result.success) {
      return NextResponse.json({ message: "Timetable archived successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to archive timetable" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error archiving timetable:", error);
    return NextResponse.json(
      { error: "Failed to archive timetable" },
      { status: 500 }
    );
  }
}
