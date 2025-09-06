import { NextRequest, NextResponse } from "next/server";
import { updateComplaintStatus } from "@/lib/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { newStatus, comment, changedBy, changedByRole } = body;

    if (!newStatus || !comment || !changedBy || !changedByRole) {
      return NextResponse.json(
        { error: "Status, comment, changedBy, and changedByRole are required" },
        { status: 400 }
      );
    }

    const result = await updateComplaintStatus({
      complaintId: parseInt(params.id),
      newStatus,
      comment,
      changedBy,
      changedByRole,
    });
    
    if (result.success) {
      return NextResponse.json({ message: "Complaint status updated successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to update complaint status" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating complaint status:", error);
    return NextResponse.json(
      { error: "Failed to update complaint status" },
      { status: 500 }
    );
  }
}
