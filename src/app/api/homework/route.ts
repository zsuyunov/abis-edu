import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Fetch homework assignments with filtering
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const branchId = searchParams.get("branchId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};
    
    if (teacherId) where.teacherId = teacherId;
    if (branchId) where.branchId = parseInt(branchId);
    if (classId) where.classId = parseInt(classId);
    if (status) where.status = status;

    const [homework, total] = await Promise.all([
      prisma.homework.findMany({
        where,
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          branch: { select: { id: true, shortName: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          submissions: {
            select: {
              id: true,
              status: true,
              grade: true,
              submittedAt: true,
              student: { select: { id: true, firstName: true, lastName: true } }
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.homework.count({ where })
    ]);

    // Calculate statistics for each homework
    const homeworkWithStats = homework.map(hw => {
      const totalStudents = hw.submissions.length;
      const completedSubmissions = hw.submissions.filter(s => s.status === 'SUBMITTED').length;
      const gradedSubmissions = hw.submissions.filter(s => s.grade !== null).length;
      const pendingSubmissions = totalStudents - completedSubmissions;

      return {
        ...hw,
        statistics: {
          totalStudents,
          completedSubmissions,
          gradedSubmissions,
          pendingSubmissions,
          completionRate: totalStudents > 0 ? Math.round((completedSubmissions / totalStudents) * 100) : 0,
          gradingRate: totalStudents > 0 ? Math.round((gradedSubmissions / totalStudents) * 100) : 0
        }
      };
    });

    return NextResponse.json({
      homework: homeworkWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new homework assignment
export async function POST(request: NextRequest) {
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
    const {
      title,
      description,
      fullMark,
      passingMark,
      givenDate,
      dueDate,
      penaltyPercent,
      enablePenalty,
      classId,
      subjectId,
      branchId,
      attachments
    } = body;

    // Create homework assignment
    const homework = await prisma.homework.create({
      data: {
        title,
        description,
        fullMark: parseInt(fullMark),
        passingMark: parseInt(passingMark),
        givenDate: new Date(givenDate),
        dueDate: new Date(dueDate),
        penaltyPercent: enablePenalty ? parseInt(penaltyPercent) : 0,
        enablePenalty,
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        branchId: parseInt(branchId),
        teacherId: decoded.userId,
        status: 'ACTIVE'
      },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        branch: { select: { id: true, shortName: true } }
      }
    });

    // Handle file attachments (placeholder for ImageKit integration)
    if (attachments && (attachments.images?.length > 0 || attachments.documents?.length > 0 || attachments.voices?.length > 0)) {
      // TODO: Integrate with ImageKit for file uploads
      console.log("Attachments to process:", attachments);
    }

    // Get all students in the class and create submissions
    const students = await prisma.student.findMany({
      where: { classId: parseInt(classId) },
      select: { id: true }
    });

    // Create homework submissions for all students
    await prisma.homeworkSubmission.createMany({
      data: students.map(student => ({
        homeworkId: homework.id,
        studentId: student.id,
        status: 'PENDING'
      }))
    });

    return NextResponse.json({ 
      message: "Homework created successfully", 
      homework 
    });

  } catch (error) {
    console.error("Error creating homework:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
