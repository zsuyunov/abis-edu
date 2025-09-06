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

    // Build query conditions - ALWAYS filter by parent.branchId matching assigned branch
    const query: any = {
      branchId: branchId,
    };

    if (search) {
      query.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { parentId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      query.status = status === "active" ? "ACTIVE" : "INACTIVE";
    }

    const [parents, count] = await prisma.$transaction([
      prisma.parent.findMany({
        where: query,
        include: {
          branch: true,
          studentParents: {
            include: {
              student: {
                where: { branchId },
                select: { id: true, firstName: true, lastName: true, class: { select: { name: true } } }
              }
            }
          }
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.parent.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      parents,
      count,
      page,
      totalPages: Math.ceil(count / ITEM_PER_PAGE)
    });

  } catch (error) {
    console.error("Support Admission parents error:", error);
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
      parentId,
      password,
      studentIds, // Array of student IDs to assign to this parent
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !parentId || !password || !studentIds || studentIds.length === 0) {
      return NextResponse.json(
        { error: "All required fields must be provided, including at least one student ID" },
        { status: 400 }
      );
    }

    // Check if parent ID already exists
    const existingParent = await prisma.parent.findUnique({
      where: { parentId }
    });

    if (existingParent) {
      return NextResponse.json(
        { error: "Parent ID already exists" },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await prisma.parent.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 }
      );
    }

    // Create parent
    const parent = await prisma.$transaction(async (tx) => {
      const created = await tx.parent.create({
        data: {
          firstName,
          lastName,
          phone,
          parentId,
          password, // hash in production
          status: "ACTIVE",
          branchId: assignedBranchId,
        },
      });

      // Create StudentParent relationships
      if (Array.isArray(studentIds) && studentIds.length > 0) {
        // Find students by their studentId (not database id) in the same branch
        const students = await tx.student.findMany({
          where: { 
            studentId: { in: studentIds }, 
            branchId: assignedBranchId 
          },
          select: { id: true },
        });
        
        if (students.length === 0) {
          throw new Error("No valid students found with the provided student IDs in the assigned branch");
        }

        const studentParentData = students.map(student => ({
          studentId: student.id,
          parentId: created.id,
          relationship: "Father" as any, // Default relationship, can be enhanced later
        }));

        await tx.studentParent.createMany({
          data: studentParentData,
          skipDuplicates: true,
        });
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Parent created successfully",
      parent
    });

  } catch (error) {
    console.error("Create parent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
