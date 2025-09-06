import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userId = headersList.get("x-user-id");

    if (role !== "main_admission" || !userId) {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

    const defaultSettings = {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        profileVisibility: "PUBLIC",
        showEmail: true,
        showPhone: false,
      },
      preferences: {
        language: "en",
        timezone: "Asia/Tashkent",
        dateFormat: "MM/DD/YYYY",
        theme: "LIGHT",
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 60,
        loginNotifications: true,
      },
    };

    // Update or create default settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: defaultSettings,
      create: {
        userId,
        ...defaultSettings,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Settings reset to default successfully",
      settings,
    });
  } catch (error) {
    console.error("Reset settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
