import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const teacherId = headersList.get("x-user-id");
    const role = headersList.get("x-user-role");
    
    if (!teacherId || role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search") || "";

    if (!classId || !branchId) {
      return NextResponse.json({ error: "Class ID and Branch ID are required" }, { status: 400 });
    }

    // Verify teacher has access to this class
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId: parseInt(classId),
        branchId: parseInt(branchId),
        role: {
          in: ["TEACHER", "SUPERVISOR"]
        }
      }
    });

    if (!teacherAssignment) {
      return NextResponse.json({ error: "Access denied to this class" }, { status: 403 });
    }

    // Build search query
    const searchQuery = search ? {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as any } },
        { lastName: { contains: search, mode: "insensitive" as any } },
        { studentId: { contains: search, mode: "insensitive" as any } },
      ]
    } : {};

    // Fetch students for the class
    const students = await prisma.student.findMany({
      where: {
        classId: parseInt(classId),
        branchId: parseInt(branchId),
        status: "ACTIVE",
        ...searchQuery,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        class: {
          select: {
            name: true,
          }
        },
        branch: {
          select: {
            shortName: true,
          }
        }
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" }
      ],
    });

    return NextResponse.json({
      success: true,
      students,
      total: students.length,
    });

  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
