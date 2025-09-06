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
                { teacherId: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where: whereClause,
        include: {},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.teacher.count({ where: whereClause }),
    ]);

    const formattedTeachers = teachers.map((teacher) => ({
      id: teacher.id,
      teacherId: teacher.teacherId,
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email || "",
      phone: teacher.phone,
      subjects: [],
      classes: [],
      branch: "",
      address: teacher.address,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      teachers: formattedTeachers,
      pagination: {
        current: page,
        totalPages,
        total,
        limit,
      },
    });

  } catch (error) {
    console.error("Main HR teachers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
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
    
    // Create teacher logic would go here
    // For now, return success response
    return NextResponse.json({
      success: true,
      message: "Teacher creation functionality to be implemented"
    });

  } catch (error) {
    console.error("Main HR teacher creation error:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
