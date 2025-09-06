import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Get user settings or create default ones
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userSettings.create({
        data: {
          userId,
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
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Main Admission settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: body,
      create: {
        userId,
        ...body,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
