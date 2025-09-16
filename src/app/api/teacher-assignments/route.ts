import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 60; // cache for 1 min

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const academicYearId = searchParams.get("academicYearId");
    const subjectId = searchParams.get("subjectId");
    const role = searchParams.get("role");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Get the most recent active academic year if none specified
    let targetAcademicYearId = academicYearId;
    if (!targetAcademicYearId) {
      const mostRecentYear = await prisma.academicYear.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: { id: true }
      });
      if (mostRecentYear) {
        targetAcademicYearId = mostRecentYear.id.toString();
      }
    }

    // Build where clause for filtering
    const whereClause = {
      status: "ACTIVE",
      ...(branchId ? { branchId: parseInt(branchId) } : {}),
      ...(targetAcademicYearId ? { academicYearId: parseInt(targetAcademicYearId) } : {}),
      ...(subjectId ? { subjectId: parseInt(subjectId) } : {}),
      ...(role ? { role: role as "TEACHER" | "SUPERVISOR" } : {}),
    };

    // Get total count for pagination
    const totalCount = await prisma.teacherAssignment.count({
      where: whereClause,
    });

    // Build assignments directly from TeacherAssignment table with pagination
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: whereClause,
      include: {
        Teacher: { select: { id: true, firstName: true, lastName: true, teacherId: true } },
        Class: { select: { id: true, name: true, branch: { select: { id: true, shortName: true } } } },
        Subject: { select: { id: true, name: true } },
        AcademicYear: { select: { id: true, name: true, isCurrent: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const assignments = teacherAssignments.map((ta) => ({
      id: ta.id,
      teacher: ta.Teacher,
      role: ta.role,
      class: {
        id: ta.Class.id,
        name: ta.Class.name,
        branch: { 
          id: ta.Class.branch.id,
          shortName: ta.Class.branch.shortName 
        },
      },
      subject: ta.Subject,
      academicYear: ta.AcademicYear,
      createdAt: ta.createdAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    
    const res = NextResponse.json({
      success: true,
      assignments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch (error) {
    console.error("Teacher assignments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, classId, subjectId, academicYearId, branchId, role } = body || {};

    // Validate required fields
    if (!teacherId || !classId || !academicYearId || !branchId) {
      return NextResponse.json({ error: "Teacher, class, branch and academic year are required" }, { status: 400 });
    }

    // Subject required for TEACHER role
    if (role !== "SUPERVISOR" && !subjectId) {
      return NextResponse.json({ error: "Subject is required for subject teachers" }, { status: 400 });
    }

    // Duplicate check
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId: Number(classId),
        academicYearId: Number(academicYearId),
        ...(subjectId ? { subjectId: Number(subjectId) } : {}),
      },
    });
    if (existing) {
      return NextResponse.json({ error: "This assignment already exists" }, { status: 400 });
    }

    // For supervisors, ensure not supervising other class in same year
    if (role === "SUPERVISOR") {
      const sup = await prisma.teacherAssignment.findFirst({
        where: { teacherId, academicYearId: Number(academicYearId), role: "SUPERVISOR" },
      });
      if (sup) {
        return NextResponse.json({ error: "Teacher already supervises a class this year" }, { status: 400 });
      }
    }

    const created = await prisma.teacherAssignment.create({
      data: {
        teacherId,
        classId: Number(classId),
        subjectId: subjectId ? Number(subjectId) : null,
        academicYearId: Number(academicYearId),
        branchId: Number(branchId),
        role: role === "SUPERVISOR" ? "SUPERVISOR" : "TEACHER",
        status: "ACTIVE",
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, assignment: created });
  } catch (error) {
    console.error("Create teacher assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const formData = await request.formData();

    const teacherId = formData.get("teacherId") as string;
    const classId = formData.get("classId") as string;
    const subjectId = formData.get("subjectId") as string;
    const comment = formData.get("comment") as string;
    const currentUserId = formData.get("currentUserId") as string;
    const academicYearId = formData.get("academicYearId") as string;

    console.log("DELETE teacher assignment:", {
      teacherId,
      classId,
      subjectId,
      comment,
      currentUserId,
      academicYearId
    });

    // Validate required fields
    if (!teacherId || !classId) {
      return NextResponse.json({ success: false, message: "Missing required fields: teacherId or classId" }, { status: 400 });
    }

    // Find and delete the assignment
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId: Number(classId),
        ...(subjectId ? { subjectId: Number(subjectId) } : {}),
        academicYearId: Number(academicYearId),
      },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 });
    }

    // Create archive comment if comment provided and currentUserId exists
    if (comment && comment.trim() && currentUserId) {
      await prisma.archiveComment.create({
        data: {
          userId: currentUserId,
          teacherId,
          classId: Number(classId),
          subjectId: subjectId ? Number(subjectId) : null,
          academicYearId: Number(academicYearId),
          timetableId: null,
          comment: `Teacher assignment removed: ${comment.trim()}`,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });
    }

    // Delete the assignment
    await prisma.teacherAssignment.delete({
      where: { id: assignment.id },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher assignment removed successfully"
    });
  } catch (error) {
    console.error("Delete teacher assignment error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
