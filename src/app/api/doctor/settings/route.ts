import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return default settings for now
    const settings = {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        profileVisibility: "BRANCH_ONLY" as const,
        showEmail: false,
        showPhone: true,
      },
      preferences: {
        language: "en",
        timezone: "Asia/Tashkent",
        dateFormat: "DD/MM/YYYY",
        theme: "LIGHT" as const,
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 60,
        loginNotifications: true,
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching doctor settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();

    // In a real application, you would save these settings to the database
    // For now, we'll just return success
    console.log("Doctor settings updated:", settings);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating doctor settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
