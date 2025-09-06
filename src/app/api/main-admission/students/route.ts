import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

const ITEM_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");

    // Check if user is main admission
    if (role !== "main_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const branchId = searchParams.get("branchId");

    // Build query conditions
    const query: any = {};

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

    if (branchId) {
      query.branchId = parseInt(branchId);
    }

    const [students, count] = await prisma.$transaction([
      prisma.student.findMany({
        where: query,
        include: {
          class: {
            include: {
              branch: true
            }
          },
          studentParents: {
            include: {
              parent: true
            }
          },
          branch: true,
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
    console.error("Main Admission students error:", error);
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

    // Check if user is main admission
    if (role !== "main_admission") {
      return NextResponse.json(
        { error: "Unauthorized - Main Admission access required" },
        { status: 403 }
      );
    }

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

    // Validate required fields
    if (!firstName || !lastName || !phone || !studentId || !password || !gender || !dateOfBirth || !branchId || !classId) {
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

    // Create student
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        phone,
        studentId,
        password, // In production, this should be hashed
        gender,
        dateOfBirth: new Date(dateOfBirth),
        branchId: parseInt(branchId),
        classId: parseInt(classId),
        status: "ACTIVE",
      },
      include: {
        class: {
          include: {
            branch: true
          }
        },
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
