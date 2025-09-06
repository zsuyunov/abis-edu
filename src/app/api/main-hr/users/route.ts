import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if user is main HR from headers
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    if (userRole !== "main_hr") {
      return NextResponse.json(
        { error: "Unauthorized. Main HR access required." },
        { status: 403 }
      );
    }

    // Verify user exists and has Main HR position
    const hrUser = await prisma.user.findUnique({
      where: { id: userId! }
    });

    if (!hrUser || hrUser.position !== "MAIN_HR") {
      return NextResponse.json(
        { error: "Invalid Main HR credentials" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const whereClause = {
      AND: [
        { status: "ACTIVE" },
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { userId: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          branch: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      userId: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email || "",
      phone: user.phone,
      position: user.position,
      branch: user.branch?.shortName || "No Branch",
      status: user.status,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        current: page,
        totalPages,
        total,
        limit,
      },
    });

  } catch (error) {
    console.error("Main HR users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is main HR from headers
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");

    if (userRole !== "main_hr") {
      return NextResponse.json(
        { error: "Unauthorized. Main HR access required." },
        { status: 403 }
      );
    }

    // Verify user exists and has Main HR position
    const hrUser = await prisma.user.findUnique({
      where: { id: userId! }
    });

    if (!hrUser || hrUser.position !== "MAIN_HR") {
      return NextResponse.json(
        { error: "Invalid Main HR credentials" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Create user logic would go here
    // For now, return success response
    return NextResponse.json({
      success: true,
      message: "User creation functionality to be implemented"
    });

  } catch (error) {
    console.error("Main HR user creation error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
