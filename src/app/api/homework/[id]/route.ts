import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Fetch specific homework with submissions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const homeworkId = parseInt(params.id);

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        branch: { select: { id: true, shortName: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        submissions: {
          include: {
            student: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true,
                studentId: true 
              } 
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    // Calculate statistics
    const totalStudents = homework.submissions.length;
    const completedSubmissions = homework.submissions.filter(s => s.status === 'SUBMITTED').length;
    const gradedSubmissions = homework.submissions.filter(s => s.grade !== null).length;
    const pendingSubmissions = totalStudents - completedSubmissions;

    const homeworkWithStats = {
      ...homework,
      statistics: {
        totalStudents,
        completedSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        completionRate: totalStudents > 0 ? Math.round((completedSubmissions / totalStudents) * 100) : 0,
        gradingRate: totalStudents > 0 ? Math.round((gradedSubmissions / totalStudents) * 100) : 0
      }
    };

    return NextResponse.json({ homework: homeworkWithStats });

  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update homework
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const homeworkId = parseInt(params.id);
    const body = await request.json();

    const homework = await prisma.homework.update({
      where: { id: homeworkId },
      data: {
        ...body,
        fullMark: body.fullMark ? parseInt(body.fullMark) : undefined,
        passingMark: body.passingMark ? parseInt(body.passingMark) : undefined,
        penaltyPercent: body.penaltyPercent ? parseInt(body.penaltyPercent) : undefined,
        givenDate: body.givenDate ? new Date(body.givenDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        branch: { select: { id: true, shortName: true } }
      }
    });

    return NextResponse.json({ 
      message: "Homework updated successfully", 
      homework 
    });

  } catch (error) {
    console.error("Error updating homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete homework
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const homeworkId = parseInt(params.id);

    // Delete all submissions first
    await prisma.homeworkSubmission.deleteMany({
      where: { homeworkId }
    });

    // Delete homework
    await prisma.homework.delete({
      where: { id: homeworkId }
    });

    return NextResponse.json({ message: "Homework deleted successfully" });

  } catch (error) {
    console.error("Error deleting homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
