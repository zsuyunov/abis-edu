import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session = AuthService.verifyToken(token);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const teacherId = url.searchParams.get("teacherId") || session.id;
    const requestedBranchId = url.searchParams.get("branchId");
    const academicYearId = url.searchParams.get("academicYearId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const view = url.searchParams.get("view") || "weekly"; // weekly, monthly, yearly

    // Verify teacher can only access their own data
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get teacher information with branch assignment
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        branch: true,
        subjects: true,
        classes: {
          include: {
            academicYear: true,
            branch: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Ensure teacher can only access data from their assigned branch
    const teacherBranchId = teacher.branchId;
    
    // If a specific branch is requested, verify it matches teacher's branch
    if (requestedBranchId && parseInt(requestedBranchId) !== teacherBranchId) {
      return NextResponse.json({ error: "Access denied to this branch" }, { status: 403 });
    }

    // Build filter conditions with mandatory branch restriction
    const where: any = {
      teacherId,
      branchId: teacherBranchId, // Always filter by teacher's assigned branch
      status: "ACTIVE",
    };

    if (academicYearId) where.academicYearId = parseInt(academicYearId);
    if (classId) where.classId = parseInt(classId);
    if (subjectId) where.subjectId = parseInt(subjectId);

    // Date filtering
    if (startDate && endDate) {
      where.fullDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get timetables with related data
    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        class: {
          include: {
            supervisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: true,
        academicYear: true,
        topics: {
          orderBy: {
            createdAt: "desc",
          },
        },
        attendances: {
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
    });

    // Check if teacher is supervisor for any classes in their branch
    const supervisedClasses = await prisma.class.findMany({
      where: {
        supervisorId: teacherId,
        branchId: teacherBranchId, // Only classes in teacher's branch
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get all timetables for supervised classes (for supervisor view)
    const supervisedTimetables = supervisedClasses.length > 0 ? await prisma.timetable.findMany({
      where: {
        classId: {
          in: supervisedClasses.map(c => c.id),
        },
        branchId: teacherBranchId, // Ensure branch consistency
        status: "ACTIVE",
        ...(startDate && endDate && {
          fullDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: true,
        academicYear: true,
        topics: {
          where: {
            teacherId, // Only show topics created by current teacher
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [
        { fullDate: "asc" },
        { startTime: "asc" },
      ],
    }) : [];

    return NextResponse.json({
      timetables,
      supervisedTimetables,
      supervisedClasses,
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        branch: teacher.branch,
      },
      view,
    });

  } catch (error) {
    console.error("Error fetching teacher timetables:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher timetables" },
      { status: 500 }
    );
  }
}
