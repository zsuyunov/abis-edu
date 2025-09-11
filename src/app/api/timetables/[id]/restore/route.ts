import { NextRequest, NextResponse } from "next/server";
import { restoreTimetable } from "@/lib/actions";

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

    const result = await restoreTimetable(params.id, comment, currentUserId);
    
    if (result.success) {
      return NextResponse.json({ message: "Timetable restored successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to restore timetable" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error restoring timetable:", error);
    return NextResponse.json(
      { error: "Failed to restore timetable" },
      { status: 500 }
    );
  }
}
