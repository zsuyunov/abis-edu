import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { archiveHomework } from "@/lib/actions";

async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, comment, createdBy } = body;

    if (!action || !comment || !createdBy) {
      return NextResponse.json(
        { error: "Action, comment, and createdBy are required" },
        { status: 400 }
      );
    }

    const result = await archiveHomework({
      homeworkId: parseInt(params.id),
      action,
      comment,
      createdBy,
    });
    
    if (result.success) {
      return NextResponse.json({ message: `Homework ${action.toLowerCase()}d successfully` });
    } else {
      return NextResponse.json(
        { error: `Failed to ${action.toLowerCase()} homework` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error archiving homework:", error);
    return NextResponse.json(
      { error: "Failed to archive homework" },
      { status: 500 }
    );
  }
}
