import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const branchId = searchParams.get("branchId");
  const academicYearId = searchParams.get("academicYearId");
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const teacherId = searchParams.get("teacherId");
  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    const where: any = {};
    
    if (branchId && branchId !== "all") {
      where.branchId = parseInt(branchId);
    }
    if (academicYearId && academicYearId !== "all") {
      where.academicYearId = parseInt(academicYearId);
    }
    if (classId && classId !== "all") {
      where.classId = parseInt(classId);
    }
    if (subjectId && subjectId !== "all") {
      where.subjectId = parseInt(subjectId);
    }
    if (teacherId && teacherId !== "all") {
      where.teacherId = teacherId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherId: true,
          },
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
        examResults: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createExam } = await import("@/lib/actions");
    
    const result = await createExam({ success: false, error: false }, body);
    
    if (result.success) {
      return NextResponse.json({ message: "Exam created successfully" });
    } else if (result.conflicts) {
      return NextResponse.json(
        { error: "Scheduling conflicts detected", conflicts: result.conflicts },
        { status: 409 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to create exam" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
