import { NextRequest, NextResponse } from "next/server";
import { withCSRF } from '@/lib/security';
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const branchId = searchParams.get("branchId");
    const academicYearId = searchParams.get("academicYearId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build student where clause
    const studentWhere: any = {};
    
    // Only get students that are assigned (have classId)
    studentWhere.classId = { not: null };
    
    if (search) {
      studentWhere.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } }
      ];
    }

    if (branchId) {
      studentWhere.branchId = parseInt(branchId);
    }

    if (classId) {
      studentWhere.classId = parseInt(classId);
    }

    if (status) {
      studentWhere.status = status;
    }

    // Build class where clause for academic year filtering
    const classWhere: any = {};
    if (academicYearId) {
      classWhere.academicYearId = parseInt(academicYearId);
    }

    console.log("🔍 Student Assignments API Filters:", {
      branchId,
      academicYearId,
      classId,
      status,
      studentWhere,
      classWhere
    });

    // Fetch assigned students with relations
    const [assignments, totalCount] = await Promise.all([
      prisma.student.findMany({
        where: {
          ...studentWhere,
          // Add class filtering for academic year
          ...(Object.keys(classWhere).length > 0 && {
            class: classWhere
          })
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              academicYear: {
                select: {
                  id: true,
                  name: true,
                  isCurrent: true,
                }
              }
            }
          },
          branch: {
            select: {
              id: true,
              shortName: true,
              district: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ 
        where: {
          ...studentWhere,
          // Add class filtering for academic year
          ...(Object.keys(classWhere).length > 0 && {
            class: classWhere
          })
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      assignments,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student assignments" },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, classId, branchId, academicYearId, status = "ACTIVE" } = body;

    // Validate required fields
    if (!studentId || !classId || !branchId || !academicYearId) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if student is already assigned
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: studentId,
        classId: { not: null }
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: "Student is already assigned to a class" },
        { status: 400 }
      );
    }

    // Update the student with assignment
    const assignment = await prisma.student.update({
      where: { id: studentId },
      data: {
        classId: parseInt(classId),
        branchId: parseInt(branchId),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                id: true,
                name: true,
                isCurrent: true,
              }
            }
          }
        },
        branch: {
          select: {
            id: true,
            shortName: true,
            district: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: "Student assignment created successfully"
    });

  } catch (error) {
    console.error("Error creating student assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create student assignment" },
      { status: 500 }
    );
  }
}

export const POST = withCSRF(postHandler);