import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { trackDocumentDownload } from "@/lib/actions";

async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { downloadedBy, userType } = body;

    if (!downloadedBy || !userType) {
      return NextResponse.json(
        { error: "downloadedBy and userType are required" },
        { status: 400 }
      );
    }

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const result = await trackDocumentDownload(
      parseInt(params.id),
      downloadedBy,
      userType,
      ipAddress,
      userAgent
    );
    
    if (result.success) {
      return NextResponse.json({ message: "Download tracked successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to track download" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error tracking download:", error);
    return NextResponse.json(
      { error: "Failed to track download" },
      { status: 500 }
    );
  }
}
