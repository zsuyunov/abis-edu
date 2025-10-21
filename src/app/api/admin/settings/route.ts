import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';
import { rateLimit, RatePresets } from '@/middlewares/rateLimit';

export const GET = authenticateJWT(authorizeRole('ADMIN')(rateLimit(RatePresets.API)(async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "admin") {
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
        profileVisibility: "PUBLIC" as const,
        showEmail: true,
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
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
})));

async function putHandler(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();

    // In a real application, you would save these settings to the database
    // For now, we'll just return success
    console.log("Admin settings updated:", settings);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export const PUT = authenticateJWT(authorizeRole('ADMIN')(rateLimit(RatePresets.API)(withCSRF(putHandler))));
