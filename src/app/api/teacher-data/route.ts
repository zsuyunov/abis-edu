import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateJWT } from '@/middlewares/authenticateJWT';
import { authorizeRole } from '@/middlewares/authorizeRole';

export const GET = authenticateJWT(authorizeRole('TEACHER')(async function GET(request: NextRequest) {
  try {
    const teacherId = request.headers.get("x-user-id");
    
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Fetch teacher data with assignments
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        TeacherAssignment: {
          include: {
            Branch: true,
            Class: { include: { branch: true, academicYear: true } },
            Subject: true,
            AcademicYear: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Transform assignments for the component
    const assignedClasses = teacher.TeacherAssignment.map(assignment => ({
      id: assignment.Class.id.toString(),
      name: assignment.Class.name,
      branch: {
        id: assignment.Branch.id.toString(),
        shortName: assignment.Branch.shortName
      }
    }));

    const assignedSubjects = teacher.TeacherAssignment
      .map(assignment => assignment.Subject)
      .filter(Boolean)
      .map(subject => ({
        id: subject!.id.toString(),
        name: subject!.name
      }));

    // Remove duplicates
    const uniqueClasses = assignedClasses.filter((cls, index, self) => 
      index === self.findIndex(c => c.id === cls.id)
    );
    
    const uniqueSubjects = assignedSubjects.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    );

    const teacherData = {
      assignedClasses: uniqueClasses,
      assignedSubjects: uniqueSubjects,
    };

    return NextResponse.json(teacherData);

  } catch (error) {
    console.error("Error fetching teacher data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}));
