import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Fetch homework submissions for grading
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
          orderBy: [
            { status: "desc" }, // SUBMITTED first
            { submittedAt: "desc" }
          ]
        }
      }
    });

    if (!homework) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    return NextResponse.json({ homework });

  } catch (error) {
    console.error("Error fetching homework for grading:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Grade a submission
export async function POST(
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

    const body = await request.json();
    const { submissionId, grade, feedback } = body;

    const submission = await prisma.homeworkSubmission.update({
      where: { id: parseInt(submissionId) },
      data: {
        grade: parseFloat(grade),
        feedback,
        gradedAt: new Date(),
        gradedBy: decoded.userId
      },
      include: {
        student: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            studentId: true 
          } 
        },
        homework: {
          select: {
            title: true,
            fullMark: true,
            passingMark: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Grade saved successfully", 
      submission 
    });

  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
