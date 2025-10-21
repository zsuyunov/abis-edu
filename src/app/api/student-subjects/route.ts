import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuthService } from "@/lib/auth";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('STUDENT', 'PARENT')(async function GET(request: NextRequest, _ctx?: any, locals?: { user?: { id: string; role: string } }) {
  try {
    const user = locals?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const requestedStudentId = url.searchParams.get("studentId") || user.id;

    // SECURITY: Verify student can only access their own data
    if (user.role === 'STUDENT' && user.id !== requestedStudentId) {
      console.warn(`🚨 SECURITY: Student ${user.id} attempted to access subjects of student ${requestedStudentId}`);
      return NextResponse.json({ error: "Access denied: You can only access your own subjects" }, { status: 403 });
    }

    // SECURITY: Parents can only access their children's data
    if (user.role === 'PARENT') {
      const studentParent = await prisma.studentParent.findFirst({
        where: {
          parentId: user.id,
          studentId: requestedStudentId
        }
      });
      
      if (!studentParent) {
        console.warn(`🚨 SECURITY: Parent ${user.id} attempted to access subjects of non-child student ${requestedStudentId}`);
        return NextResponse.json({ error: "Access denied: You can only access your children's subjects" }, { status: 403 });
      }
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
}));