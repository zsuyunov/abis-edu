import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

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
    const examId = url.searchParams.get("examId");
    const studentId = url.searchParams.get("studentId");
    
    // Verify teacher access
    if (session.id !== teacherId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (examId) {
      // Get exam results for a specific exam
      const examResults = await prisma.examResult.findMany({
        where: {
          examId: parseInt(examId),
          teacherId: teacherId,
        },
      include: {
          student: {
          select: {
            id: true,
              firstName: true,
              lastName: true,
              studentId: true,
          },
        },
          exam: {
          select: {
            id: true,
            name: true,
              subject: {
          select: {
            id: true,
            name: true,
                },
              },
          },
        },
      },
      orderBy: {
          student: {
            firstName: "asc",
          },
      },
    });

      return NextResponse.json({ examResults });
    }

    if (studentId) {
      // Get exam results for a specific student
      const examResults = await prisma.examResult.findMany({
        where: {
          studentId: studentId,
          teacherId: teacherId,
        },
        include: {
          exam: {
                select: {
                  id: true,
              name: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          exam: {
            date: "desc",
          },
        },
      });

      return NextResponse.json({ examResults });
    }

    // Get teacher's exams overview
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacherId,
        status: "ACTIVE",
      },
      include: {
        Subject: true,
        Class: true,
        Branch: true,
      },
    });

    const exams = await prisma.exam.findMany({
      where: {
        teacherId: teacherId,
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
            shortName: true,
              },
            },
          },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({
      teacherAssignments,
      exams,
    });
  } catch (error) {
    console.error("Error fetching teacher exam results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { examId, studentId, marksObtained, feedback } = body;

    if (!examId || !studentId || marksObtained === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the exam belongs to this teacher
    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(examId) },
    });

    if (!exam || exam.teacherId !== session.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create or update exam result
    const examResult = await prisma.examResult.upsert({
            where: {
              examId_studentId: {
          examId: parseInt(examId),
          studentId,
        },
      },
      update: {
        marksObtained,
        feedback: feedback || null,
        teacherId: session.id,
      },
      create: {
        examId: parseInt(examId),
        studentId,
        marksObtained,
        feedback: feedback || null,
        teacherId: session.id,
        status: "GRADED",
                branchId: exam.branchId,
              },
    });

    return NextResponse.json({ examResult });
  } catch (error) {
    console.error("Error creating/updating exam result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}