import { NextRequest, NextResponse } from "next/server";
import { checkExamConflicts } from "@/lib/actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, classId, roomNumber, excludeExamId } = body;

    if (!date || !startTime || !endTime || !classId || !roomNumber) {
      return NextResponse.json(
        { error: "Missing required fields for conflict detection" },
        { status: 400 }
      );
    }

    const result = await checkExamConflicts({
      date: new Date(date),
      startTime,
      endTime,
      classId,
      roomNumber,
      excludeExamId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking exam conflicts:", error);
    return NextResponse.json(
      { error: "Failed to check conflicts" },
      { status: 500 }
    );
  }
}
