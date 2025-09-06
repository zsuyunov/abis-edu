import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check if user is support HR from headers
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    const branchId = request.headers.get("x-branch-id");

    if (userRole !== "support_hr") {
      return NextResponse.json(
        { error: "Unauthorized. Support HR access required." },
        { status: 403 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { error: "Support HR must be assigned to a branch" },
        { status: 400 }
      );
    }

    // Verify user exists and has Support HR position
    const hrUser = await prisma.user.findUnique({
      where: { id: userId! },
      include: { branch: true }
    });

    if (!hrUser || hrUser.position !== "SUPPORT_HR" || hrUser.branchId !== parseInt(branchId)) {
      return NextResponse.json(
        { error: "Invalid Support HR credentials" },
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
        { branchId: parseInt(branchId) }, // Filter by Support HR's branch only
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
      branchName: hrUser.branch?.shortName,
      pagination: {
        current: page,
        totalPages,
        total,
        limit,
      },
    });

  } catch (error) {
    console.error("Support HR users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is support HR from headers
    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    const branchId = request.headers.get("x-branch-id");

    if (userRole !== "support_hr") {
      return NextResponse.json(
        { error: "Unauthorized. Support HR access required." },
        { status: 403 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { error: "Support HR must be assigned to a branch" },
        { status: 400 }
      );
    }

    // Verify user exists and has Support HR position
    const hrUser = await prisma.user.findUnique({
      where: { id: userId! }
    });

    if (!hrUser || hrUser.position !== "SUPPORT_HR" || hrUser.branchId !== parseInt(branchId)) {
      return NextResponse.json(
        { error: "Invalid Support HR credentials" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Enforce that Support HR can only create users in their own branch
    if (body.branchId && body.branchId !== parseInt(branchId)) {
      return NextResponse.json(
        { error: "Support HR can only create users in their assigned branch" },
        { status: 403 }
      );
    }

    // Create user logic would go here
    // For now, return success response
    return NextResponse.json({
      success: true,
      message: "User creation functionality to be implemented"
    });

  } catch (error) {
    console.error("Support HR user creation error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
