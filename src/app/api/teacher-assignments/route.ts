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

    // Build assignments directly from TeacherAssignment table
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        status: "ACTIVE",
        ...(branchId ? { branchId: parseInt(branchId) } : {}),
        ...(targetAcademicYearId ? { academicYearId: parseInt(targetAcademicYearId) } : {}),
        ...(subjectId ? { subjectId: parseInt(subjectId) } : {}),
        ...(role ? { role: role as "TEACHER" | "SUPERVISOR" } : {}),
      },
      include: {
        Teacher: { select: { id: true, firstName: true, lastName: true, teacherId: true } },
        Class: { select: { id: true, name: true, branch: { select: { shortName: true } } } },
        Subject: { select: { id: true, name: true } },
        AcademicYear: { select: { id: true, name: true, isCurrent: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const assignments = teacherAssignments.map((ta) => ({
      id: ta.id,
      teacher: ta.Teacher,
      role: ta.role,
      class: {
        id: ta.Class.id,
        name: ta.Class.name,
        branch: { shortName: ta.Class.branch.shortName },
      },
      subject: ta.Subject,
      academicYear: ta.AcademicYear,
      createdAt: ta.createdAt,
    }));

    const res = NextResponse.json({
      success: true,
      assignments,
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
