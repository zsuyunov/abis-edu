import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.headers.get('x-user-id');
    let authenticatedUserId = studentId;

    if (!studentId) {
      const authHeader = request.headers.get('authorization');
      const token = AuthService.extractTokenFromHeader(authHeader);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const session = AuthService.verifyToken(token);
      if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticatedUserId = session.id;
    }

    const url = new URL(request.url);
    const requestedStudentId = url.searchParams.get("studentId") || authenticatedUserId;

    // Verify student can only access their own data
    if (authenticatedUserId !== requestedStudentId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!requestedStudentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Get student's subjects through timetables
    const timetables = await prisma.timetable.findMany({
      where: {
        classId: {
          in: await prisma.student.findUnique({
            where: { id: requestedStudentId },
            select: { classId: true }
          }).then(s => s?.classId ? [s.classId] : [])
        }
      },
      include: {
        class: true,
      },
      distinct: ['subjectId'],
    });

    // Extract unique subject IDs from timetables
    const allSubjectIds = timetables
      .map(timetable => timetable.subjectId)
      .filter(id => id !== null && id !== undefined)
      .map(id => typeof id === 'number' ? id : parseInt(String(id)))
      .filter(id => !isNaN(id));
    
    const subjectIds = Array.from(new Set(allSubjectIds));

    // Fetch subjects by IDs
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: subjectIds }
      },
      select: {
        id: true,
        name: true,
      }
    });

    return NextResponse.json({
      subjects: subjects.map(subject => ({
        id: subject.id.toString(),
        name: subject.name,
      })),
    });

  } catch (error) {
    console.error("Error fetching student subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}