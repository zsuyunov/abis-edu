import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const branchId = searchParams.get('branchId');
    const classId = searchParams.get('classId');

    // Build where clause for teacher assignments
    const whereClause: any = {
      status: 'ACTIVE'
    };

    // For subject filtering, prioritize subject-specific assignments
    if (subjectId) {
      whereClause.subjectId = parseInt(subjectId);
    }

    // Add branch filter if provided
    if (branchId) {
      whereClause.branchId = parseInt(branchId);
    }
    
    // Add class filter if provided
    if (classId) {
      whereClause.classId = parseInt(classId);
    }

    // Get teachers through their assignments
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: whereClause,
      include: {
        Teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teacherId: true,
            status: true
          }
        },
        Subject: {
          select: {
            id: true,
            name: true
          }
        }
      },
      distinct: ['teacherId']
    });

    // Transform the data to include subjects for each teacher
    const teachersMap = new Map();
    
    teacherAssignments.forEach(assignment => {
      if (!assignment.Teacher) return;
      
      const teacherId = assignment.Teacher.id;
      
      if (!teachersMap.has(teacherId)) {
        teachersMap.set(teacherId, {
          id: assignment.Teacher.id,
          firstName: assignment.Teacher.firstName,
          lastName: assignment.Teacher.lastName,
          teacherId: assignment.Teacher.teacherId,
          status: assignment.Teacher.status,
          subjects: []
        });
      }
      
      const teacher = teachersMap.get(teacherId);
      if (assignment.Subject && !teacher.subjects.find((s: any) => s.id === assignment.Subject!.id)) {
        teacher.subjects.push({
          id: assignment.Subject.id,
          name: assignment.Subject.name
        });
      }
    });

    let teachers = Array.from(teachersMap.values());

    console.log('Teachers with subjects API - Input params:', { subjectId, branchId, classId });
    console.log('Teachers with subjects API - Where clause:', whereClause);
    console.log('Teachers with subjects API - Found assignments:', teacherAssignments.length);
    console.log('Teachers with subjects API - Final teachers:', teachers.length);

    // If no teachers found with specific assignments, get all teachers for the subject
    if (teachers.length === 0 && subjectId) {
      console.log('No specific assignments found, fetching all teachers for subject...');
      
      const allTeachers = await prisma.teacher.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          teacherId: true
        }
      });

      // Add subjects to each teacher (empty for now, but structure is there)
      teachers = allTeachers.map(teacher => ({
        ...teacher,
        subjects: []
      }));

      console.log('Fallback - Found all teachers:', teachers.length);
    }

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Teachers with subjects API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch teachers with subjects",
      },
      { status: 500 }
    );
  }
}
