import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For admin, we need to get from the admin table
    const admin = await prisma.admin.findUnique({
      where: { id: userId },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const profile = {
      firstName: "Admin",
      lastName: "User",
      phone: admin.phone,
      email: "admin@example.com",
      address: "Admin Address",
      position: "admin",
      branchId: null,
      branch: null,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, phone, email, address } = await request.json();

    // For admin, we can only update phone since that's what's in the admin table
    const updatedAdmin = await prisma.admin.update({
      where: { id: userId },
      data: {
        phone,
      },
    });

    const profile = {
      firstName: "Admin",
      lastName: "User",
      phone: updatedAdmin.phone,
      email: "admin@example.com",
      address: "Admin Address",
      position: "admin",
      branchId: null,
      branch: null,
    };

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
