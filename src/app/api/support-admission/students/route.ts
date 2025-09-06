import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

const ITEM_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userBranchId = headersList.get("x-branch-id");

    // Check if user is support admission
    if (role !== "support_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Support Admission access required" },
        { status: 403 }
      );
    }

    // Check if user has assigned branch
    if (!userBranchId) {
      return NextResponse.json(
        { error: "No branch assigned to user" },
        { status: 400 }
      );
    }

    const branchId = parseInt(userBranchId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Build query conditions - ALWAYS filter by user's branch
    const query: any = {
      branchId: branchId, // CRITICAL: Always filter by assigned branch
    };

    if (search) {
      query.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      query.status = status === "active" ? "ACTIVE" : "INACTIVE";
    }

    const [students, count] = await prisma.$transaction([
      prisma.student.findMany({
        where: query,
        include: {
          class: true,
          studentParents: {
            include: {
              parent: true
            }
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.student.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      students,
      count,
      page,
      totalPages: Math.ceil(count / ITEM_PER_PAGE)
    });

  } catch (error) {
    console.error("Support Admission students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userBranchId = headersList.get("x-branch-id");

    // Check if user is support admission
    if (role !== "support_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Support Admission access required" },
        { status: 403 }
      );
    }

    // Check if user has assigned branch
    if (!userBranchId) {
      return NextResponse.json(
        { error: "No branch assigned to user" },
        { status: 400 }
      );
    }

    const assignedBranchId = parseInt(userBranchId);

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      studentId,
      password,
      gender,
      dateOfBirth,
      branchId,
      classId,
    } = body;

    // CRITICAL: Validate that the branchId matches the user's assigned branch
    if (branchId && parseInt(branchId) !== assignedBranchId) {
      return NextResponse.json(
        { error: "Unauthorized - Cannot create students for other branches" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !phone || !studentId || !password || !gender || !dateOfBirth || !classId) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student ID already exists" },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await prisma.student.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 }
      );
    }

    // Validate that the selected class belongs to the user's branch
    const selectedClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: { branch: true }
    });

    if (!selectedClass || selectedClass.branchId !== assignedBranchId) {
      return NextResponse.json(
        { error: "Invalid class - Class must belong to your assigned branch" },
        { status: 400 }
      );
    }

    // Create student - ALWAYS use assigned branch ID
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        phone,
        studentId,
        password, // In production, this should be hashed
        gender,
        dateOfBirth: new Date(dateOfBirth),
        branchId: assignedBranchId, // CRITICAL: Always use assigned branch
        classId: parseInt(classId),
        status: "ACTIVE",
      },
      include: {
        class: true,
        branch: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Student created successfully",
      student
    });

  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
